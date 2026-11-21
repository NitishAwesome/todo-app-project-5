from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


class UserPreferenceUpdate(BaseModel):
    theme: Literal["light", "dark", "system"] | None = None
    timezone: str | None = None
    notifications_enabled: bool | None = None
    default_task_view: Literal["dashboard", "tasks", "kanban", "calendar"] | None = None


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    theme: str
    timezone: str
    notifications_enabled: bool
    default_task_view: str
    updated_at: datetime
