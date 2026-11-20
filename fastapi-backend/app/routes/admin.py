from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.task import Task
from app.models.user import User

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


# Replace with Rehan's actual require_admin dependency.
def require_admin():
    raise HTTPException(
        status_code=501,
        detail="Admin authentication integration pending."
    )


@router.get("/tasks")
def get_all_tasks(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    tasks = db.query(Task, User).join(
        User, Task.user_id == User.id
    ).all()

    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "created_at": task.created_at,
            "owner": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }
        for task, user in tasks
    ]


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    return {
        "total_users": db.query(User).count(),
        "total_tasks": db.query(Task).count(),
        "pending_tasks": db.query(Task).filter(
            Task.status == "Pending"
        ).count(),
        "in_progress_tasks": db.query(Task).filter(
            Task.status == "InProgress"
        ).count(),
        "completed_tasks": db.query(Task).filter(
            Task.status == "Completed"
        ).count()
    }