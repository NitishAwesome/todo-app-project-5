from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.team_task import (
    TeamTaskCreate, TeamTaskUpdate, TeamTaskDetailResponse,
    TaskAssignmentResponse, AssignmentProgressUpdate,
    AssignmentDiscussionCreate, AssignmentDiscussionResponse,
    AdminReminderCreate, TeamAnalyticsResponse
)
from app.services import team_task_service

router = APIRouter(prefix="/api", tags=["Team Collaboration & Assignments"])


# -------------------------------------------------------------------------
# ADMIN ENDPOINTS
# -------------------------------------------------------------------------

@router.post("/admin/team-tasks", response_model=TeamTaskDetailResponse, status_code=status.HTTP_201_CREATED)
def create_team_task(
    data: TeamTaskCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a shared team task and assigns it to selected users."""
    return team_task_service.create_team_task(db, current_admin, data)


@router.get("/admin/team-tasks", response_model=list[TeamTaskDetailResponse])
def get_admin_team_tasks(
    search: str | None = Query(None, description="Search by title or description"),
    priority: str | None = Query(None, description="Filter by priority: Low, Medium, High"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin retrieves all shared team tasks with per-recipient progress rollups."""
    return team_task_service.get_admin_team_tasks(db, current_admin, search, priority)


@router.get("/admin/team-tasks/{task_id}", response_model=TeamTaskDetailResponse)
def get_admin_team_task_detail(
    task_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin inspects a specific team task, all assigned recipients, and discussion history."""
    return team_task_service.get_admin_team_task_detail(db, current_admin, task_id)


@router.patch("/admin/team-tasks/{task_id}", response_model=TeamTaskDetailResponse)
def update_team_task(
    task_id: int,
    data: TeamTaskUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin updates task instructions, deadline, or adds new assignees."""
    return team_task_service.update_team_task(db, current_admin, task_id, data)


@router.delete("/admin/team-tasks/{task_id}")
def delete_team_task(
    task_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin deletes a shared team task and its associated assignments."""
    return team_task_service.delete_team_task(db, current_admin, task_id)


@router.delete("/admin/assignments/{assignment_id}")
def revoke_task_assignment(
    assignment_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin revokes/cancels an individual user assignment from a shared team task."""
    return team_task_service.revoke_task_assignment(db, current_admin, assignment_id)


@router.post("/admin/team-tasks/{task_id}/remind")
def send_admin_reminder(
    task_id: int,
    data: AdminReminderCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin sends immediate or scheduled deadline reminder to targeted assignees."""
    return team_task_service.send_admin_reminder(db, current_admin, task_id, data)


@router.get("/admin/team-analytics", response_model=TeamAnalyticsResponse)
def get_team_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin retrieves team productivity metrics, assignment completion rates, and member rollups."""
    return team_task_service.get_team_analytics(db, current_admin)


# -------------------------------------------------------------------------
# RECIPIENT USER ENDPOINTS ("ASSIGNED TO ME")
# -------------------------------------------------------------------------

@router.get("/assignments/me", response_model=list[TaskAssignmentResponse])
def get_my_assigned_tasks(
    search: str | None = Query(None, description="Search assigned task title or description"),
    status: str | None = Query(None, description="Filter by status: Pending, InProgress, Completed"),
    priority: str | None = Query(None, description="Filter by priority: Low, Medium, High"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recipient user retrieves all tasks assigned to them."""
    return team_task_service.get_user_assigned_tasks(db, current_user, search, status, priority)


@router.patch("/assignments/{assignment_id}/progress", response_model=TaskAssignmentResponse)
def update_assignment_progress(
    assignment_id: int,
    data: AssignmentProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recipient updates their status, completion percentage (0-100), notes, or blockers."""
    return team_task_service.update_user_assignment_progress(db, current_user, assignment_id, data)


@router.get("/assignments/{assignment_id}/discussions", response_model=list[AssignmentDiscussionResponse])
def get_assignment_discussions(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get conversation and progress update thread for an individual assignment."""
    return team_task_service.get_assignment_discussions(db, current_user, assignment_id)


@router.post("/assignments/{assignment_id}/discussions", response_model=AssignmentDiscussionResponse, status_code=status.HTTP_201_CREATED)
def add_assignment_discussion_message(
    assignment_id: int,
    data: AssignmentDiscussionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send message, question, or update in assignment thread."""
    return team_task_service.add_assignment_discussion_message(db, current_user, assignment_id, data)
