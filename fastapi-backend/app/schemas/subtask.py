from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SubtaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    sort_order: int = 0


class SubtaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    is_completed: bool | None = None
    sort_order: int | None = None


class SubtaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    title: str
    is_completed: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
