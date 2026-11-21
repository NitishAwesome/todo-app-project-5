from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    assignment_id = Column(Integer, ForeignKey("task_assignments.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(String(50), default="reminder", nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(255), nullable=True)
    actor_name = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
    read_at = Column(DateTime, nullable=True)
