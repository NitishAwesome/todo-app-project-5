from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.tag import Tag, task_tags
from app.schemas.tag import TagCreate, TagUpdate, TagResponse, TaskTagAssign

router = APIRouter(
    tags=["Tags"]
)

DEFAULT_TAGS = [
    {"name": "Frontend", "color": "#6366f1"},
    {"name": "Backend", "color": "#0ea5e9"},
    {"name": "Urgent", "color": "#ef4444"},
    {"name": "Design", "color": "#ec4899"},
]


@router.get("/api/tags/", response_model=list[TagResponse])
def get_user_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all custom tags belonging to the authenticated user. Seeds default tags on first access."""
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).order_by(Tag.name.asc()).all()
    if not tags:
        for dt in DEFAULT_TAGS:
            new_tag = Tag(user_id=current_user.id, name=dt["name"], color=dt["color"])
            db.add(new_tag)
        db.commit()
        tags = db.query(Tag).filter(Tag.user_id == current_user.id).order_by(Tag.name.asc()).all()

    return tags


@router.post("/api/tags/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tag for the authenticated user."""
    name = payload.name.strip()
    existing = db.query(Tag).filter(Tag.user_id == current_user.id, Tag.name == name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag '{name}' already exists.")

    tag = Tag(user_id=current_user.id, name=name, color=payload.color or "#6366f1")
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.patch("/api/tags/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    payload: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tag name or color."""
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found.")

    if payload.name and payload.name.strip():
        new_name = payload.name.strip()
        conflict = (
            db.query(Tag)
            .filter(Tag.user_id == current_user.id, Tag.name == new_name, Tag.id != tag_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag '{new_name}' already exists.")
        tag.name = new_name

    if payload.color:
        tag.color = payload.color

    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/api/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a tag."""
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found.")

    db.delete(tag)
    db.commit()
    return None


@router.get("/api/tasks/{task_id}/tags", response_model=list[TagResponse])
def get_task_tags(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all tags associated with a specific task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    rows = (
        db.query(Tag)
        .join(task_tags, Tag.id == task_tags.c.tag_id)
        .filter(task_tags.c.task_id == task_id, Tag.user_id == current_user.id)
        .all()
    )
    return rows


@router.post("/api/tasks/{task_id}/tags", response_model=list[TagResponse])
def assign_task_tags(
    task_id: int,
    payload: TaskTagAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign a list of tags to a task. Verifies that all tags and the task belong to the authenticated user."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Validate all tags belong to user
    valid_tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids), Tag.user_id == current_user.id).all()
    valid_ids = {t.id for t in valid_tags}

    # Delete existing associations for this task
    db.execute(task_tags.delete().where(task_tags.c.task_id == task_id))

    # Insert new associations
    for tid in valid_ids:
        db.execute(task_tags.insert().values(task_id=task_id, tag_id=tid))

    db.commit()

    return valid_tags
