from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.subtask import Subtask
from app.models.activity_log import TaskActivityLog
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate, SubtaskResponse

router = APIRouter(
    tags=["Subtasks"]
)


@router.get("/api/tasks/{task_id}/subtasks", response_model=list[SubtaskResponse])
def get_task_subtasks(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all subtasks belonging to a specific task owned by the authenticated user."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return (
        db.query(Subtask)
        .filter(Subtask.task_id == task_id)
        .order_by(Subtask.sort_order.asc(), Subtask.id.asc())
        .all()
    )


@router.post("/api/tasks/{task_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(
    task_id: int,
    payload: SubtaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a subtask checklist item under a task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    subtask = Subtask(
        task_id=task_id,
        user_id=current_user.id,
        title=payload.title.strip(),
        is_completed=False,
        sort_order=payload.sort_order,
    )
    db.add(subtask)

    # Activity log
    log = TaskActivityLog(
        task_id=task_id,
        actor_user_id=current_user.id,
        action="subtask_created",
        changed_fields=json.dumps({"subtask_title": subtask.title}),
    )
    db.add(log)

    db.commit()
    db.refresh(subtask)
    return subtask


@router.patch("/api/subtasks/{subtask_id}", response_model=SubtaskResponse)
def update_subtask(
    subtask_id: int,
    payload: SubtaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update subtask properties."""
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.user_id == current_user.id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    changes = {}
    if payload.title is not None and payload.title.strip():
        changes["title"] = {"old": subtask.title, "new": payload.title.strip()}
        subtask.title = payload.title.strip()
    if payload.is_completed is not None:
        changes["is_completed"] = {"old": subtask.is_completed, "new": payload.is_completed}
        subtask.is_completed = payload.is_completed
    if payload.sort_order is not None:
        subtask.sort_order = payload.sort_order

    if changes:
        log = TaskActivityLog(
            task_id=subtask.task_id,
            actor_user_id=current_user.id,
            action="subtask_updated",
            changed_fields=json.dumps(changes),
        )
        db.add(log)

    db.commit()
    db.refresh(subtask)
    return subtask


@router.patch("/api/subtasks/{subtask_id}/toggle", response_model=SubtaskResponse)
def toggle_subtask(
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle subtask completion state."""
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.user_id == current_user.id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    subtask.is_completed = not subtask.is_completed
    log = TaskActivityLog(
        task_id=subtask.task_id,
        actor_user_id=current_user.id,
        action="subtask_completed" if subtask.is_completed else "subtask_reopened",
        changed_fields=json.dumps({"subtask_id": subtask.id, "is_completed": subtask.is_completed}),
    )
    db.add(log)

    db.commit()
    db.refresh(subtask)
    return subtask


@router.delete("/api/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtask(
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a subtask."""
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id, Subtask.user_id == current_user.id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    db.delete(subtask)
    db.commit()
    return None
