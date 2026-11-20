from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services import task_service

router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"]
)


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return task_service.create_task(
            db, task_data, current_user.id
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    q: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    sort: str = Query("newest", pattern="^(newest|due_soon|priority_high)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if status and status not in ["Pending", "InProgress", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid status.")

    if priority and priority not in ["Low", "Medium", "High"]:
        raise HTTPException(status_code=400, detail="Invalid priority.")

    return task_service.get_user_tasks(
        db, current_user.id, q, status, priority, sort
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = task_service.get_task_by_id(
        db, task_id, current_user.id
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = task_service.get_task_by_id(
        db, task_id, current_user.id
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    try:
        return task_service.update_task(
            db, task, task_data, current_user.id
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = task_service.get_task_by_id(
        db, task_id, current_user.id
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    return task_service.delete_task(db, task)
