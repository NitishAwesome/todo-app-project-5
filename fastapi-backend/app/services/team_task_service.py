import datetime
from datetime import datetime as dt, timezone as tz, time as dtime
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.models.team_task import TeamTask, TaskAssignment, AssignmentDiscussion
from app.models.user import User
from app.models.notification import Notification
from app.schemas.team_task import (
    TeamTaskCreate, TeamTaskUpdate, AssignmentProgressUpdate,
    AssignmentDiscussionCreate, AdminReminderCreate,
    TaskAssignmentResponse, TeamTaskDetailResponse,
    AssignmentDiscussionResponse, TeamAnalyticsResponse
)


def _format_assignment_response(assignment: TaskAssignment) -> TaskAssignmentResponse:
    task = assignment.team_task
    admin = task.admin if task else None
    user = assignment.user

    discussions_res = [
        AssignmentDiscussionResponse(
            id=d.id,
            assignment_id=d.assignment_id,
            sender_id=d.sender_id,
            sender_role=d.sender_role,
            sender_name=d.sender.name if d.sender else "User",
            message_type=d.message_type,
            message=d.message,
            progress_percent=d.progress_percent,
            status_update=d.status_update,
            is_read=d.is_read,
            created_at=d.created_at
        ) for d in (assignment.discussions or [])
    ]

    return TaskAssignmentResponse(
        id=assignment.id,
        team_task_id=assignment.team_task_id,
        user_id=assignment.user_id,
        user_name=user.name if user else "Unknown User",
        user_email=user.email if user else "",
        status=assignment.status,
        progress_percent=assignment.progress_percent,
        assigned_at=assignment.assigned_at,
        started_at=assignment.started_at,
        completed_at=assignment.completed_at,
        last_activity_at=assignment.last_activity_at,
        notes=assignment.notes,
        blockers=assignment.blockers,
        checklist_state=assignment.checklist_state,
        task_title=task.title if task else "",
        task_description=task.description if task else None,
        task_instructions=task.instructions if task else None,
        task_priority=task.priority if task else "Medium",
        task_due_date=task.due_date if task else None,
        task_due_time=task.due_time if task else None,
        task_due_datetime=task.due_datetime if task else None,
        task_timezone=task.timezone if task else "UTC",
        task_checklist=task.checklist if task else None,
        admin_name=admin.name if admin else "Administrator",
        admin_email=admin.email if admin else "",
        discussions=discussions_res
    )


def create_team_task(db: Session, admin_user: User, data: TeamTaskCreate) -> TeamTaskDetailResponse:
    if admin_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can assign team tasks."
        )

    # Compute due_datetime in UTC if date is provided
    due_dt = None
    if data.due_date:
        t = data.due_time or dtime(23, 59, 59)
        due_dt = dt.combine(data.due_date, t)

    # Validate assignee IDs
    assignees = db.query(User).filter(User.id.in_(data.assignee_ids)).all()
    if not assignees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid assignees selected."
        )

    # Format checklist template
    checklist_template = None
    if data.checklist:
        checklist_template = [
            {"id": idx + 1, "text": item.strip(), "done": False}
            for idx, item in enumerate(data.checklist) if item.strip()
        ]

    # Create Shared TeamTask
    new_team_task = TeamTask(
        admin_id=admin_user.id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        instructions=data.instructions.strip() if data.instructions else None,
        priority=data.priority,
        due_date=data.due_date,
        due_time=data.due_time,
        due_datetime=due_dt,
        timezone=data.timezone or "UTC",
        checklist=checklist_template
    )
    db.add(new_team_task)
    db.flush()

    # Create individual TaskAssignments (Independent Progress)
    created_assignments = []
    for u in assignees:
        assignment = TaskAssignment(
            team_task_id=new_team_task.id,
            user_id=u.id,
            status="Pending",
            progress_percent=0,
            checklist_state=checklist_template
        )
        db.add(assignment)
        db.flush()
        created_assignments.append(assignment)

        # In-App Notification Pop-up
        if data.send_immediate_notification:
            notif = Notification(
                user_id=u.id,
                assignment_id=assignment.id,
                type="assignment",
                title=f"New Task Assigned: {new_team_task.title}",
                message=f"Administrator {admin_user.name} assigned you: '{new_team_task.title}'. Due: {new_team_task.due_date or 'No deadline'} {str(new_team_task.due_time)[:5] if new_team_task.due_time else ''}",
                actor_name=admin_user.name,
                action_url=f"/app?tab=assigned&assignment_id={assignment.id}"
            )
            db.add(notif)

        # Initial System Discussion entry
        disc = AssignmentDiscussion(
            assignment_id=assignment.id,
            sender_id=admin_user.id,
            sender_role="Admin",
            message_type="system",
            message=f"Task assigned to {u.name} by {admin_user.name}.",
            is_read=True
        )
        db.add(disc)

    db.commit()
    db.refresh(new_team_task)

    return get_admin_team_task_detail(db, admin_user, new_team_task.id)


def get_admin_team_tasks(
    db: Session,
    admin_user: User,
    search: str | None = None,
    priority: str | None = None
) -> list[TeamTaskDetailResponse]:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    query = db.query(TeamTask).order_by(TeamTask.created_at.desc())
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TeamTask.title.ilike(search_filter),
                TeamTask.description.ilike(search_filter)
            )
        )
    if priority and priority in ["Low", "Medium", "High"]:
        query = query.filter(TeamTask.priority == priority)

    tasks = query.all()
    results = []
    now = dt.now()

    for t in tasks:
        assignments = t.assignments or []
        total = len(assignments)
        pending = sum(1 for a in assignments if a.status == "Pending")
        in_prog = sum(1 for a in assignments if a.status == "InProgress")
        completed = sum(1 for a in assignments if a.status == "Completed")
        
        # Overdue: not completed and due_datetime is in the past
        overdue = 0
        if t.due_datetime:
            overdue = sum(1 for a in assignments if a.status != "Completed" and t.due_datetime < now)
        elif t.due_date:
            today = now.date()
            overdue = sum(1 for a in assignments if a.status != "Completed" and t.due_date < today)

        completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

        assignment_responses = [_format_assignment_response(a) for a in assignments]

        results.append(TeamTaskDetailResponse(
            id=t.id,
            admin_id=t.admin_id,
            admin_name=t.admin.name if t.admin else "Administrator",
            admin_email=t.admin.email if t.admin else "",
            title=t.title,
            description=t.description,
            instructions=t.instructions,
            priority=t.priority,
            due_date=t.due_date,
            due_time=t.due_time,
            due_datetime=t.due_datetime,
            timezone=t.timezone,
            checklist=t.checklist,
            created_at=t.created_at,
            updated_at=t.updated_at,
            total_assignments=total,
            pending_count=pending,
            in_progress_count=in_prog,
            completed_count=completed,
            overdue_count=overdue,
            completion_rate=completion_rate,
            assignments=assignment_responses
        ))

    return results


def get_admin_team_task_detail(
    db: Session,
    admin_user: User,
    team_task_id: int
) -> TeamTaskDetailResponse:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    t = db.query(TeamTask).filter(TeamTask.id == team_task_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team task not found.")

    assignments = t.assignments or []
    total = len(assignments)
    pending = sum(1 for a in assignments if a.status == "Pending")
    in_prog = sum(1 for a in assignments if a.status == "InProgress")
    completed = sum(1 for a in assignments if a.status == "Completed")
    
    now = dt.now()
    overdue = 0
    if t.due_datetime:
        overdue = sum(1 for a in assignments if a.status != "Completed" and t.due_datetime < now)
    elif t.due_date:
        today = now.date()
        overdue = sum(1 for a in assignments if a.status != "Completed" and t.due_date < today)

    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0
    assignment_responses = [_format_assignment_response(a) for a in assignments]

    return TeamTaskDetailResponse(
        id=t.id,
        admin_id=t.admin_id,
        admin_name=t.admin.name if t.admin else "Administrator",
        admin_email=t.admin.email if t.admin else "",
        title=t.title,
        description=t.description,
        instructions=t.instructions,
        priority=t.priority,
        due_date=t.due_date,
        due_time=t.due_time,
        due_datetime=t.due_datetime,
        timezone=t.timezone,
        checklist=t.checklist,
        created_at=t.created_at,
        updated_at=t.updated_at,
        total_assignments=total,
        pending_count=pending,
        in_progress_count=in_prog,
        completed_count=completed,
        overdue_count=overdue,
        completion_rate=completion_rate,
        assignments=assignment_responses
    )


def update_team_task(
    db: Session,
    admin_user: User,
    team_task_id: int,
    data: TeamTaskUpdate
) -> TeamTaskDetailResponse:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    t = db.query(TeamTask).filter(TeamTask.id == team_task_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team task not found.")

    if data.title is not None:
        t.title = data.title.strip()
    if data.description is not None:
        t.description = data.description.strip()
    if data.instructions is not None:
        t.instructions = data.instructions.strip()
    if data.priority is not None:
        t.priority = data.priority
    if data.due_date is not None:
        t.due_date = data.due_date
    if data.due_time is not None:
        t.due_time = data.due_time
    if data.timezone is not None:
        t.timezone = data.timezone

    if data.due_date or data.due_time:
        d = t.due_date
        tm = t.due_time or dtime(23, 59, 59)
        t.due_datetime = dt.combine(d, tm) if d else None

    # Handle removing assignees
    if data.remove_assignee_ids:
        for a in list(t.assignments or []):
            if a.user_id in data.remove_assignee_ids:
                db.query(AssignmentDiscussion).filter(AssignmentDiscussion.assignment_id == a.id).delete()
                db.query(Notification).filter(Notification.assignment_id == a.id).delete()
                db.delete(a)

    # Handle adding new assignees
    if data.add_assignee_ids:
        existing_user_ids = {a.user_id for a in t.assignments}
        for uid in data.add_assignee_ids:
            if uid not in existing_user_ids:
                u = db.query(User).filter(User.id == uid).first()
                if u:
                    new_a = TaskAssignment(
                        team_task_id=t.id,
                        user_id=u.id,
                        status="Pending",
                        progress_percent=0,
                        checklist_state=t.checklist
                    )
                    db.add(new_a)
                    db.flush()

                    notif = Notification(
                        user_id=u.id,
                        assignment_id=new_a.id,
                        type="assignment",
                        title=f"New Task Assigned: {t.title}",
                        message=f"Administrator {admin_user.name} assigned you: '{t.title}'.",
                        actor_name=admin_user.name,
                        action_url=f"/app?tab=assigned&assignment_id={new_a.id}"
                    )
                    db.add(notif)

    db.commit()
    return get_admin_team_task_detail(db, admin_user, t.id)


def revoke_task_assignment(db: Session, admin_user: User, assignment_id: int) -> dict[str, Any]:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    a = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    team_task_id = a.team_task_id
    db.query(AssignmentDiscussion).filter(AssignmentDiscussion.assignment_id == a.id).delete()
    db.query(Notification).filter(Notification.assignment_id == a.id).delete()
    db.delete(a)
    db.commit()
    return {"status": "success", "message": "Assignment revoked successfully.", "team_task_id": team_task_id}


def delete_team_task(db: Session, admin_user: User, team_task_id: int) -> dict[str, Any]:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    t = db.query(TeamTask).filter(TeamTask.id == team_task_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team task not found.")

    for a in t.assignments or []:
        db.query(AssignmentDiscussion).filter(AssignmentDiscussion.assignment_id == a.id).delete()
        db.query(Notification).filter(Notification.assignment_id == a.id).delete()
        db.delete(a)

    db.delete(t)
    db.commit()
    return {"status": "success", "message": "Team task deleted successfully."}


def send_admin_reminder(
    db: Session,
    admin_user: User,
    team_task_id: int,
    data: AdminReminderCreate
) -> dict[str, Any]:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    t = db.query(TeamTask).filter(TeamTask.id == team_task_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team task not found.")

    assignments = t.assignments or []
    target_assignments = []
    now = dt.now()

    if data.recipient_filter == "all":
        target_assignments = assignments
    elif data.recipient_filter == "incomplete":
        target_assignments = [a for a in assignments if a.status != "Completed"]
    elif data.recipient_filter == "overdue":
        if t.due_datetime:
            target_assignments = [a for a in assignments if a.status != "Completed" and t.due_datetime < now]
        elif t.due_date:
            target_assignments = [a for a in assignments if a.status != "Completed" and t.due_date < now.date()]
    elif data.recipient_filter == "selected" and data.selected_user_ids:
        target_assignments = [a for a in assignments if a.user_id in data.selected_user_ids]

    sent_count = 0
    for a in target_assignments:
        # Create In-App Notification
        notif = Notification(
            user_id=a.user_id,
            assignment_id=a.id,
            type="reminder",
            title=f"Reminder: {t.title}",
            message=data.message.strip(),
            actor_name=admin_user.name,
            action_url=f"/app?tab=assigned&assignment_id={a.id}"
        )
        db.add(notif)

        # Record in discussion history
        disc = AssignmentDiscussion(
            assignment_id=a.id,
            sender_id=admin_user.id,
            sender_role="Admin",
            message_type="reminder",
            message=data.message.strip(),
            is_read=False
        )
        db.add(disc)
        sent_count += 1

    db.commit()
    return {
        "status": "success",
        "team_task_id": team_task_id,
        "reminders_sent": sent_count,
        "filter": data.recipient_filter
    }


def get_user_assigned_tasks(
    db: Session,
    current_user: User,
    search: str | None = None,
    status_filter: str | None = None,
    priority_filter: str | None = None
) -> list[TaskAssignmentResponse]:
    query = db.query(TaskAssignment).filter(TaskAssignment.user_id == current_user.id)

    if status_filter and status_filter in ["Pending", "InProgress", "Completed"]:
        query = query.filter(TaskAssignment.status == status_filter)

    assignments = query.all()

    # Apply search and priority filtering on team_task fields
    results = []
    for a in assignments:
        t = a.team_task
        if not t:
            continue
        if search:
            s = search.strip().lower()
            if s not in t.title.lower() and (not t.description or s not in t.description.lower()):
                continue
        if priority_filter and priority_filter in ["Low", "Medium", "High"]:
            if t.priority != priority_filter:
                continue

        results.append(_format_assignment_response(a))

    # Sort: Pending/InProgress first, then by due date
    def sort_key(item: TaskAssignmentResponse):
        status_rank = 0 if item.status == "InProgress" else (1 if item.status == "Pending" else 2)
        due = item.task_due_datetime or (dt.combine(item.task_due_date, dtime.max) if item.task_due_date else dt.max)
        return (status_rank, due)

    results.sort(key=sort_key)
    return results


def update_user_assignment_progress(
    db: Session,
    current_user: User,
    assignment_id: int,
    data: AssignmentProgressUpdate
) -> TaskAssignmentResponse:
    a = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    if a.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this assignment.")

    now = dt.now()
    prev_status = a.status

    if data.status:
        a.status = data.status
        if data.status == "InProgress" and not a.started_at:
            a.started_at = now
        elif data.status == "Completed":
            a.completed_at = now
            a.progress_percent = 100
        elif data.status in ["Pending", "InProgress"]:
            a.completed_at = None

    if data.progress_percent is not None:
        a.progress_percent = data.progress_percent
        if a.progress_percent == 100 and a.status != "Completed":
            a.status = "Completed"
            a.completed_at = now

    if data.notes is not None:
        a.notes = data.notes.strip()
    if data.blockers is not None:
        a.blockers = data.blockers.strip()
    if data.checklist_state is not None:
        a.checklist_state = data.checklist_state

    # Add discussion record for structured progress update
    update_note = data.notes or f"Updated status to {a.status} ({a.progress_percent}% completed)."
    disc = AssignmentDiscussion(
        assignment_id=a.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message_type="progress_update",
        message=update_note,
        progress_percent=a.progress_percent,
        status_update=a.status,
        is_read=False
    )
    db.add(disc)

    # Notify Admin of recipient's progress or completion
    task = a.team_task
    if task and task.admin_id != current_user.id:
        notif_title = f"{current_user.name} completed: {task.title}" if a.status == "Completed" else f"Update on {task.title}: {current_user.name}"
        notif_msg = f"{current_user.name} reported: {update_note}"
        if a.blockers:
            notif_msg += f" [Blocker: {a.blockers}]"

        admin_notif = Notification(
            user_id=task.admin_id,
            assignment_id=a.id,
            type="progress_update",
            title=notif_title,
            message=notif_msg,
            actor_name=current_user.name,
            action_url=f"/admin/assignments?task_id={task.id}"
        )
        db.add(admin_notif)

    db.commit()
    db.refresh(a)
    return _format_assignment_response(a)


def add_assignment_discussion_message(
    db: Session,
    current_user: User,
    assignment_id: int,
    data: AssignmentDiscussionCreate
) -> AssignmentDiscussionResponse:
    a = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    task = a.team_task
    is_assignee = (a.user_id == current_user.id)
    is_admin = (current_user.role == "Admin")

    if not is_assignee and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this discussion.")

    disc = AssignmentDiscussion(
        assignment_id=a.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message_type=data.message_type,
        message=data.message.strip(),
        progress_percent=data.progress_percent,
        status_update=data.status_update,
        is_read=False
    )
    db.add(disc)

    # Cross-notify the counterpart
    if is_assignee and task:
        # Notify the administrator
        notif = Notification(
            user_id=task.admin_id,
            assignment_id=a.id,
            type="discussion",
            title=f"Message from {current_user.name} on {task.title}",
            message=data.message.strip(),
            actor_name=current_user.name,
            action_url=f"/admin/assignments?task_id={task.id}"
        )
        db.add(notif)
    elif is_admin:
        # Notify the assignee
        notif = Notification(
            user_id=a.user_id,
            assignment_id=a.id,
            type="discussion",
            title=f"Admin message from {current_user.name}",
            message=data.message.strip(),
            actor_name=current_user.name,
            action_url=f"/app?tab=assigned&assignment_id={a.id}"
        )
        db.add(notif)

    db.commit()
    db.refresh(disc)

    return AssignmentDiscussionResponse(
        id=disc.id,
        assignment_id=disc.assignment_id,
        sender_id=disc.sender_id,
        sender_role=disc.sender_role,
        sender_name=current_user.name,
        message_type=disc.message_type,
        message=disc.message,
        progress_percent=disc.progress_percent,
        status_update=disc.status_update,
        is_read=disc.is_read,
        created_at=disc.created_at
    )


def get_assignment_discussions(
    db: Session,
    current_user: User,
    assignment_id: int
) -> list[AssignmentDiscussionResponse]:
    a = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

    if a.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Mark unread messages sent by the counterpart as read
    db.query(AssignmentDiscussion).filter(
        AssignmentDiscussion.assignment_id == assignment_id,
        AssignmentDiscussion.sender_id != current_user.id,
        AssignmentDiscussion.is_read == False
    ).update({"is_read": True})
    db.commit()

    discussions = (
        db.query(AssignmentDiscussion)
        .filter(AssignmentDiscussion.assignment_id == assignment_id)
        .order_by(AssignmentDiscussion.created_at.asc())
        .all()
    )

    return [
        AssignmentDiscussionResponse(
            id=d.id,
            assignment_id=d.assignment_id,
            sender_id=d.sender_id,
            sender_role=d.sender_role,
            sender_name=d.sender.name if d.sender else "User",
            message_type=d.message_type,
            message=d.message,
            progress_percent=d.progress_percent,
            status_update=d.status_update,
            is_read=d.is_read,
            created_at=d.created_at
        ) for d in discussions
    ]


def get_team_analytics(db: Session, admin_user: User) -> TeamAnalyticsResponse:
    if admin_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    total_tasks = db.query(TeamTask).count()
    all_assignments = db.query(TaskAssignment).all()
    total_assignments = len(all_assignments)

    pending = sum(1 for a in all_assignments if a.status == "Pending")
    in_prog = sum(1 for a in all_assignments if a.status == "InProgress")
    completed = sum(1 for a in all_assignments if a.status == "Completed")

    now = dt.now()
    overdue = 0
    for a in all_assignments:
        if a.status != "Completed":
            t = a.team_task
            if t:
                if t.due_datetime and t.due_datetime < now:
                    overdue += 1
                elif t.due_date and t.due_date < now.date():
                    overdue += 1

    overall_rate = round((completed / total_assignments * 100), 1) if total_assignments > 0 else 0.0

    # Per-member breakdown
    user_map: dict[int, dict[str, Any]] = {}
    for a in all_assignments:
        u = a.user
        if not u:
            continue
        if u.id not in user_map:
            user_map[u.id] = {
                "user_id": u.id,
                "name": u.name,
                "email": u.email,
                "total": 0,
                "completed": 0,
                "in_progress": 0,
                "pending": 0,
                "overdue": 0
            }
        user_map[u.id]["total"] += 1
        if a.status == "Completed":
            user_map[u.id]["completed"] += 1
        elif a.status == "InProgress":
            user_map[u.id]["in_progress"] += 1
        else:
            user_map[u.id]["pending"] += 1

        if a.status != "Completed":
            t = a.team_task
            if t and ((t.due_datetime and t.due_datetime < now) or (t.due_date and t.due_date < now.date())):
                user_map[u.id]["overdue"] += 1

    members = list(user_map.values())
    for m in members:
        m["completion_rate"] = round((m["completed"] / m["total"] * 100), 1) if m["total"] > 0 else 0.0

    members.sort(key=lambda x: x["name"])

    return TeamAnalyticsResponse(
        total_team_tasks=total_tasks,
        total_assignments=total_assignments,
        active_assignments=in_prog,
        completed_assignments=completed,
        pending_assignments=pending,
        overdue_assignments=overdue,
        overall_completion_rate=overall_rate,
        members_breakdown=members
    )
