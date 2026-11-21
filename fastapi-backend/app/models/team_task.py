from sqlalchemy import (
    Column, Integer, String, Text, Date, Time, DateTime, TIMESTAMP,
    ForeignKey, Enum, Boolean, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class TeamTask(Base):
    __tablename__ = "team_tasks"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    priority = Column(Enum("Low", "Medium", "High"), default="Medium", nullable=False)
    due_date = Column(Date, nullable=True)
    due_time = Column(Time, nullable=True)
    due_datetime = Column(DateTime, nullable=True, index=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    checklist = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    admin = relationship("User", foreign_keys=[admin_id], lazy="selectin")
    assignments = relationship("TaskAssignment", back_populates="team_task", cascade="all, delete-orphan", lazy="selectin")


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    team_task_id = Column(Integer, ForeignKey("team_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum("Pending", "InProgress", "Completed"), default="Pending", nullable=False, index=True)
    progress_percent = Column(Integer, default=0, nullable=False)
    assigned_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_activity_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    notes = Column(Text, nullable=True)
    blockers = Column(Text, nullable=True)
    checklist_state = Column(JSON, nullable=True)

    team_task = relationship("TeamTask", back_populates="assignments", lazy="selectin")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    discussions = relationship("AssignmentDiscussion", back_populates="assignment", cascade="all, delete-orphan", lazy="selectin")


class AssignmentDiscussion(Base):
    __tablename__ = "assignment_discussions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("task_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(Enum("Admin", "User"), nullable=False)
    message_type = Column(
        Enum("comment", "inquiry", "progress_update", "blocker_report", "reminder", "system"),
        default="comment",
        nullable=False
    )
    message = Column(Text, nullable=False)
    progress_percent = Column(Integer, nullable=True)
    status_update = Column(Enum("Pending", "InProgress", "Completed"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)

    assignment = relationship("TaskAssignment", back_populates="discussions", lazy="selectin")
    sender = relationship("User", foreign_keys=[sender_id], lazy="selectin")
