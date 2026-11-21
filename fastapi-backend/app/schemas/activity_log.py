from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TaskActivityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    actor_user_id: int
    action: str
    changed_fields: str | None = None
    created_at: datetime
