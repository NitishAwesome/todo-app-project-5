from datetime import date, time, datetime
from typing import Literal, Any
from pydantic import BaseModel, Field, ConfigDict


class AssignmentDiscussionCreate(BaseModel):
    message: str = Field(min_length=1)
    message_type: Literal["comment", "inquiry", "progress_update", "blocker_report", "reminder", "system"] = "comment"
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    status_update: Literal["Pending", "InProgress", "Completed"] | None = None


class AssignmentDiscussionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    sender_id: int
    sender_role: str
    sender_name: str | None = None
    message_type: str
    message: str
    progress_percent: int | None
    status_update: str | None
    is_read: bool
    created_at: datetime


class AssignmentProgressUpdate(BaseModel):
    status: Literal["Pending", "InProgress", "Completed"] | None = None
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None
    blockers: str | None = None
    checklist_state: Any = None


class TeamTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    instructions: str | None = None
    priority: Literal["Low", "Medium", "High"] = "Medium"
    due_date: date | None = None
    due_time: time | None = None
    due_datetime: datetime | None = None
    timezone: str = "UTC"
    assignee_ids: list[int] = Field(min_length=1)
    checklist: list[str] | None = None
    send_immediate_notification: bool = True
    reminder_at: datetime | None = None


class TeamTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    instructions: str | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    due_date: date | None = None
    due_time: time | None = None
    due_datetime: datetime | None = None
    timezone: str | None = None
    checklist: list[str] | None = None
    add_assignee_ids: list[int] | None = None
    remove_assignee_ids: list[int] | None = None


class AdminReminderCreate(BaseModel):
    recipient_filter: Literal["all", "selected", "incomplete", "overdue"] = "incomplete"
    selected_user_ids: list[int] | None = None
    message: str = Field(min_length=1)
    schedule_at: datetime | None = None


class AssigneeSummary(BaseModel):
    id: int
    name: str
    email: str
    role: str


class TaskAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_task_id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    status: str
    progress_percent: int
    assigned_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    last_activity_at: datetime | None = None
    notes: str | None = None
    blockers: str | None = None
    checklist_state: Any = None
    
    # Embedded task information
    task_title: str | None = None
    task_description: str | None = None
    task_instructions: str | None = None
    task_priority: str | None = None
    task_due_date: date | None = None
    task_due_time: time | None = None
    task_due_datetime: datetime | None = None
    task_timezone: str | None = None
    task_checklist: Any = None
    admin_name: str | None = None
    admin_email: str | None = None

    discussions: list[AssignmentDiscussionResponse] = []


class TeamTaskDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    admin_id: int
    admin_name: str | None = None
    admin_email: str | None = None
    title: str
    description: str | None
    instructions: str | None
    priority: str
    due_date: date | None
    due_time: time | None = None
    due_datetime: datetime | None = None
    timezone: str = "UTC"
    checklist: Any = None
    created_at: datetime
    updated_at: datetime

    total_assignments: int = 0
    pending_count: int = 0
    in_progress_count: int = 0
    completed_count: int = 0
    overdue_count: int = 0
    completion_rate: float = 0.0

    assignments: list[TaskAssignmentResponse] = []


class TeamAnalyticsResponse(BaseModel):
    total_team_tasks: int
    total_assignments: int
    active_assignments: int
    completed_assignments: int
    pending_assignments: int
    overdue_assignments: int
    overall_completion_rate: float
    members_breakdown: list[dict[str, Any]] = []
