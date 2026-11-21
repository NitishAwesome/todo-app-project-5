from sqlalchemy import Column, Integer, String, DateTime, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.sql import func
from app.database.base import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    remind_at = Column(DateTime, nullable=False, index=True)
    status = Column(Enum("Pending", "Triggered", "Cancelled"), default="Pending", nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
    triggered_at = Column(DateTime, nullable=True)
