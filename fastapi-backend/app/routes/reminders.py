from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.schemas.reminder import ReminderCreate, ReminderResponse

router = APIRouter(
    prefix="/api/reminders",
    tags=["Reminders"]
)


@router.get("/", response_model=list[ReminderResponse])
def get_user_reminders(
    task_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all reminders for the authenticated user, optionally filtered by task."""
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    if task_id:
        query = query.filter(Reminder.task_id == task_id)
    return query.order_by(Reminder.remind_at.asc()).all()


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule a task reminder. Remind_at is stored in UTC."""
    task = db.query(Task).filter(Task.id == payload.task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    reminder = Reminder(
        user_id=current_user.id,
        task_id=payload.task_id,
        remind_at=payload.remind_at,
        status="Pending",
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel or delete a reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found.")

    db.delete(reminder)
    db.commit()
    return None


@router.post("/process-due", summary="Check and trigger due reminders into in-app notifications")
def process_due_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Checks pending reminders that have matured and generates in-app notifications."""
    now = datetime.now()
    due_reminders = (
        db.query(Reminder, Task)
        .join(Task, Reminder.task_id == Task.id)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.status == "Pending",
            Reminder.remind_at <= now,
        )
        .all()
    )

    created_notifications = []
    for rem, task in due_reminders:
        rem.status = "Triggered"
        rem.triggered_at = now

        notif = Notification(
            user_id=current_user.id,
            task_id=task.id,
            type="reminder",
            title=f"Reminder: {task.title}",
            message=f"Task '{task.title}' deadline is approaching! Priority: {task.priority}.",
            is_read=False,
        )
        db.add(notif)
        created_notifications.append(notif)

    db.commit()
    return {"triggered_count": len(created_notifications)}
