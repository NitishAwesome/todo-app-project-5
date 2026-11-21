from datetime import date
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import require_admin
from app.models.task import Task
from app.models.user import User
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserItem,
    AdminUserListResponse,
    UserRoleUpdate,
    AdminTaskItem,
    AdminTaskListResponse,
    TaskOwnerInfo,
)

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Retrieve system-wide aggregated statistics for the Planova Admin Dashboard."""
    total_users = db.query(User).count()
    total_tasks = db.query(Task).count()

    pending_tasks = db.query(Task).filter(Task.status == "Pending").count()
    in_progress_tasks = db.query(Task).filter(Task.status == "InProgress").count()
    completed_tasks = db.query(Task).filter(Task.status == "Completed").count()

    # Overdue tasks: status != Completed and due_date < today
    today = date.today()
    overdue_tasks = db.query(Task).filter(
        Task.status != "Completed",
        Task.due_date.isnot(None),
        Task.due_date < today
    ).count()

    completion_rate = (
        round((completed_tasks / total_tasks) * 100, 1)
        if total_tasks > 0
        else 0.0
    )

    high_priority = db.query(Task).filter(Task.priority == "High").count()
    med_priority = db.query(Task).filter(Task.priority == "Medium").count()
    low_priority = db.query(Task).filter(Task.priority == "Low").count()

    return {
        "total_users": total_users,
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_rate": completion_rate,
        "tasks_by_priority": {
            "High": high_priority,
            "Medium": med_priority,
            "Low": low_priority,
        },
        "tasks_by_status": {
            "Pending": pending_tasks,
            "InProgress": in_progress_tasks,
            "Completed": completed_tasks,
        },
    }


@router.get("/users", response_model=AdminUserListResponse)
def get_admin_users(
    q: str | None = None,
    role: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Retrieve paginated and searchable list of registered users with task metrics."""
    query = db.query(User)

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(or_(User.name.ilike(search), User.email.ilike(search)))

    if role and role in ["User", "Admin"]:
        query = query.filter(User.role == role)

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    users = query.order_by(User.id.asc()).offset(offset).limit(page_size).all()

    # Calculate task counts for each user in the page
    items = []
    for u in users:
        task_count = db.query(Task).filter(Task.user_id == u.id).count()
        completed_count = db.query(Task).filter(
            Task.user_id == u.id,
            Task.status == "Completed"
        ).count()

        items.append(
            AdminUserItem(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                created_at=u.created_at,
                task_count=task_count,
                completed_task_count=completed_count,
            )
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.patch("/users/{user_id}/role", response_model=AdminUserItem)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a user's role (User or Admin). Prevents an admin from demoting themselves."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent admin from demoting own account
    if target_user.id == admin.id and payload.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove Admin privileges from your own account."
        )

    # Last-admin protection: Cannot demote the last remaining administrator
    if target_user.role == "Admin" and payload.role != "Admin":
        admin_count = db.query(User).filter(User.role == "Admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last remaining administrator in the system."
            )

    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)

    task_count = db.query(Task).filter(Task.user_id == target_user.id).count()
    completed_count = db.query(Task).filter(
        Task.user_id == target_user.id,
        Task.status == "Completed"
    ).count()

    return AdminUserItem(
        id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        created_at=target_user.created_at,
        task_count=task_count,
        completed_task_count=completed_count,
    )


@router.get("/tasks", response_model=AdminTaskListResponse)
def get_all_tasks(
    q: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Retrieve paginated and searchable system-wide task list for administrators."""
    query = db.query(Task, User).join(User, Task.user_id == User.id)

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search),
                Task.description.ilike(search),
                User.name.ilike(search),
                User.email.ilike(search),
            )
        )

    if status and status in ["Pending", "InProgress", "Completed"]:
        query = query.filter(Task.status == status)

    if priority and priority in ["Low", "Medium", "High"]:
        query = query.filter(Task.priority == priority)

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    results = (
        query.order_by(Task.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    items = [
        AdminTaskItem(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date,
            created_at=task.created_at,
            owner=TaskOwnerInfo(
                id=user.id,
                name=user.name,
                email=user.email,
            ),
        )
        for task, user in results
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
