from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


class ReminderCreate(BaseModel):
    task_id: int
    remind_at: datetime


class ReminderUpdate(BaseModel):
    remind_at: datetime | None = None
    status: Literal["Pending", "Triggered", "Cancelled"] | None = None


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    task_id: int
    remind_at: datetime
    status: str
    created_at: datetime
    triggered_at: datetime | None = None
