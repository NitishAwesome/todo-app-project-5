from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.subtask import SubtaskResponse
from app.schemas.tag import TagResponse


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    status: Literal["Pending", "InProgress", "Completed"] = "Pending"
    priority: Literal["Low", "Medium", "High"] = "Medium"
    due_date: date | None = None
    category_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: Literal["Pending", "InProgress", "Completed"] | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    due_date: date | None = None
    category_id: int | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    category_id: int | None
    title: str
    description: str | None
    status: str
    priority: str
    due_date: date | None
    created_at: datetime
    updated_at: datetime
    subtasks: list[SubtaskResponse] = []
    tags: list[TagResponse] = []
