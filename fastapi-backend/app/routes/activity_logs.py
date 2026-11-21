from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.activity_log import TaskActivityLog
from app.schemas.activity_log import TaskActivityLogResponse

router = APIRouter(
    tags=["Activity Logs"]
)


@router.get("/api/tasks/{task_id}/activity", response_model=list[TaskActivityLogResponse])
def get_task_activity(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve activity history audit trail for a task. Enforces user ownership or Admin privilege."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if task.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this task's activity log.")

    return (
        db.query(TaskActivityLog)
        .filter(TaskActivityLog.task_id == task_id)
        .order_by(TaskActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
