from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.category import Category
from app.models.task import Task
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"]
)


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = (
        db.query(Category)
        .filter(Category.user_id == current_user.id)
        .order_by(Category.name.asc())
        .all()
    )

    # Seed default starter categories if user currently has none
    if not categories:
        default_names = ["Work", "Personal", "Study"]
        for d_name in default_names:
            db.add(Category(user_id=current_user.id, name=d_name))
        try:
            db.commit()
            categories = (
                db.query(Category)
                .filter(Category.user_id == current_user.id)
                .order_by(Category.name.asc())
                .all()
            )
        except Exception:
            db.rollback()

    return categories


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean_name = category_data.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty.")

    # Check for existing duplicate category for this user
    existing = (
        db.query(Category)
        .filter(Category.user_id == current_user.id, Category.name == clean_name)
        .first()
    )
    if existing:
        return existing

    new_cat = Category(user_id=current_user.id, name=clean_name)
    db.add(new_cat)
    try:
        db.commit()
        db.refresh(new_cat)
        return new_cat
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create category.")


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a user category with application-level disassociation.
    Replaces MySQL trigger `trg_categories_before_delete` to ensure identical,
    distributed-safe behavior across both MySQL and TiDB Cloud.
    """
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    # Application-level equivalent of trg_categories_before_delete:
    # Unlinks all tasks from this category before deletion without deleting the tasks
    db.query(Task).filter(
        Task.category_id == category_id,
        Task.user_id == current_user.id
    ).update({"category_id": None}, synchronize_session="fetch")

    db.delete(cat)
    db.commit()
    return None

