from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.preference import UserPreferenceUpdate, UserPreferenceResponse

router = APIRouter(
    prefix="/api/preferences",
    tags=["Preferences"]
)


@router.get("/", response_model=UserPreferenceResponse)
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve or initialize preferences for the authenticated user."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            theme="light",
            timezone="UTC",
            notifications_enabled=True,
            default_task_view="dashboard",
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.patch("/", response_model=UserPreferenceResponse)
def update_user_preferences(
    payload: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update settings for theme, default task view, notifications, or timezone."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            theme="light",
            timezone="UTC",
            notifications_enabled=True,
            default_task_view="dashboard",
        )
        db.add(pref)

    if payload.theme is not None:
        pref.theme = payload.theme
    if payload.timezone is not None:
        pref.timezone = payload.timezone
    if payload.notifications_enabled is not None:
        pref.notifications_enabled = payload.notifications_enabled
    if payload.default_task_view is not None:
        pref.default_task_view = payload.default_task_view

    db.commit()
    db.refresh(pref)
    return pref
