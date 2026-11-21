from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel


class AdminStatsResponse(BaseModel):
    total_users: int
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    tasks_by_priority: dict[str, int]
    tasks_by_status: dict[str, int]


class AdminUserItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    task_count: int = 0
    completed_task_count: int = 0


class AdminUserListResponse(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserRoleUpdate(BaseModel):
    role: Literal["User", "Admin"]


class TaskOwnerInfo(BaseModel):
    id: int
    name: str
    email: str


class AdminTaskItem(BaseModel):
    id: int
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: date | None = None
    created_at: datetime
    owner: TaskOwnerInfo


class AdminTaskListResponse(BaseModel):
    items: list[AdminTaskItem]
    total: int
    page: int
    page_size: int
    total_pages: int
