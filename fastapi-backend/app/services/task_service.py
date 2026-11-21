import json
from datetime import date, time, datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.task import Task
from app.models.category import Category
from app.models.activity_log import TaskActivityLog
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, task_data: TaskCreate, user_id: int):
    if task_data.category_id is not None:
        category = db.query(Category).filter(
            Category.id == task_data.category_id,
            Category.user_id == user_id
        ).first()

        if not category:
            raise ValueError("Invalid category or category does not belong to you.")

    due_dt = None
    if task_data.due_date and task_data.due_time:
        due_dt = datetime.combine(task_data.due_date, task_data.due_time)

    task = Task(
        user_id=user_id,
        category_id=task_data.category_id,
        title=task_data.title.strip(),
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.due_date,
        due_time=task_data.due_time,
        due_datetime=due_dt,
        timezone=task_data.timezone or "UTC"
    )

    db.add(task)
    db.flush()

    # Record activity log
    log = TaskActivityLog(
        task_id=task.id,
        actor_user_id=user_id,
        action="created",
        changed_fields=json.dumps({
            "title": task.title,
            "priority": task.priority,
            "status": task.status,
            "due_date": str(task.due_date) if task.due_date else None,
        })
    )
    db.add(log)

    db.commit()
    db.refresh(task)

    return task


def get_user_tasks(
    db: Session,
    user_id: int,
    q: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    sort: str = "newest"
):
    query = db.query(Task).filter(Task.user_id == user_id)

    if q:
        query = query.filter(Task.title.ilike(f"%{q}%"))

    if status:
        query = query.filter(Task.status == status)

    if priority:
        query = query.filter(Task.priority == priority)

    if sort == "due_soon":
        query = query.order_by(Task.due_date.asc())
    elif sort == "priority_high":
        query = query.order_by(Task.priority.desc())
    else:
        query = query.order_by(Task.created_at.desc())

    return query.all()


def get_task_by_id(db: Session, task_id: int, user_id: int):
    return db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()


def update_task(
    db: Session,
    task: Task,
    task_data: TaskUpdate,
    user_id: int
):
    updates = task_data.model_dump(exclude_unset=True)

    if "title" in updates:
        if updates["title"] is None or not updates["title"].strip():
            raise ValueError("Title cannot be empty.")
        updates["title"] = updates["title"].strip()

    if "category_id" in updates and updates["category_id"] is not None:
        category = db.query(Category).filter(
            Category.id == updates["category_id"],
            Category.user_id == user_id
        ).first()

        if not category:
            raise ValueError("Invalid category or category does not belong to you.")

    # Track changed fields for activity logging
    changed = {}
    action_type = "updated"

    for key, value in updates.items():
        old_val = getattr(task, key)
        if old_val != value:
            old_str = str(old_val) if isinstance(old_val, (date,)) else old_val
            new_str = str(value) if isinstance(value, (date,)) else value
            changed[key] = {"old": old_str, "new": new_str}

            if key == "status":
                if value == "Completed":
                    action_type = "completed"
                elif old_val == "Completed":
                    action_type = "reopened"
                else:
                    action_type = "status_changed"
            elif key == "priority" and action_type == "updated":
                action_type = "priority_changed"

            setattr(task, key, value)

    if "due_date" in updates or "due_time" in updates:
        d = task.due_date
        t = task.due_time
        task.due_datetime = datetime.combine(d, t) if (d and t) else None

    if changed:
        log = TaskActivityLog(
            task_id=task.id,
            actor_user_id=user_id,
            action=action_type,
            changed_fields=json.dumps(changed)
        )
        db.add(log)

    db.commit()
    db.refresh(task)

    return task


def delete_task(db: Session, task: Task):
    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully."}
