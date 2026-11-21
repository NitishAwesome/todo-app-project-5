from sqlalchemy import (
    Column, Integer, String, Text, Date, Time, DateTime, TIMESTAMP,
    ForeignKey, ForeignKeyConstraint, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    category_id = Column(Integer, nullable=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(
        Enum("Pending", "InProgress", "Completed"),
        default="Pending",
        nullable=False
    )

    priority = Column(
        Enum("Low", "Medium", "High"),
        default="Medium",
        nullable=False
    )

    due_date = Column(Date, nullable=True)
    due_time = Column(Time, nullable=True)
    due_datetime = Column(DateTime, nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)

    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    subtasks = relationship("Subtask", cascade="all, delete-orphan", lazy="selectin")
    tags = relationship("Tag", secondary="task_tags", lazy="selectin")

    __table_args__ = (
        ForeignKeyConstraint(
            ["category_id", "user_id"],
            ["categories.id", "categories.user_id"],
            name="fk_tasks_category_same_user"
        ),
    )
