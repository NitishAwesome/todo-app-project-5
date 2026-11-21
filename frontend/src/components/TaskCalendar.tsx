import { useState, useMemo, useEffect, useCallback } from "react";
import { taskApi, categoryApi } from "../taskAPI";
import type { Task, Category } from "../types/task";
import "./TaskCalendar.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TaskCalendarProps {
  onEdit: (task: Task) => void;
  onAddTaskOnDate?: (dateStr: string) => void;
}

export default function TaskCalendar({ onEdit, onAddTaskOnDate }: TaskCalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Current view date (year & month)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Fetch real tasks and categories
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fetchedTasks, fetchedCategories] = await Promise.all([
        taskApi.getAll(),
        categoryApi.getAll().catch(() => [] as Category[]),
      ]);
      setTasks(fetchedTasks);
      setCategories(fetchedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Jump to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month title formatter (e.g. "November 2026")
  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  // Map tasks by date string "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (t.due_date) {
        const dStr = t.due_date.slice(0, 10);
        if (!map[dStr]) {
          map[dStr] = [];
        }
        map[dStr].push(t);
      }
    }
    return map;
  }, [tasks]);

  // Unscheduled tasks (tasks with no due date)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.due_date);
  }, [tasks]);

  // Calculate calendar days grid (including padding from previous & next months)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      // Format as YYYY-MM-DD using local year, month, day to avoid timezone drift
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  if (loading) {
    return (
      <div className="planova-workspace-loading" role="status">
        <div className="workspace-spinner" />
        <p>Loading Planova Calendar...</p>
      </div>
    );
  }

  return (
    <section className="planova-calendar-section" aria-label="Task Calendar">
      {error && (
        <div className="calendar-error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Calendar Header Bar */}
      <div className="calendar-header-bar">
        <div>
          <div className="calendar-title-row">
            <h2 className="calendar-title">{monthTitle}</h2>
            <span className="calendar-badge">Planova Schedule</span>
          </div>
          <p className="calendar-subtitle">
            Track milestones, upcoming deadlines, and click any date or task to manage it.
          </p>
        </div>

        <div className="calendar-controls">
          <button
            type="button"
            className="calendar-btn-today"
            onClick={handleToday}
            title="Jump to today"
          >
            Today
          </button>

          <div className="calendar-nav-group">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              title="Previous month"
              aria-label="Previous month"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              title="Next month"
              aria-label="Next month"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-layout-container">
        {/* Main Calendar Grid */}
        <div className="calendar-main-grid-wrapper">
          {/* Weekday Labels Header */}
          <div className="calendar-weekdays-row" role="row">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="calendar-weekday-cell" role="columnheader">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid" role="grid">
            {calendarDays.map((cell) => {
              const dayTasks = tasksByDate[cell.dateStr] || [];

              return (
                <div
                  key={cell.dateStr}
                  className={`calendar-day-cell ${
                    cell.isCurrentMonth ? "in-month" : "out-of-month"
                  } ${cell.isToday ? "is-today" : ""}`}
                  onClick={() => onAddTaskOnDate && onAddTaskOnDate(cell.dateStr)}
                  title={
                    onAddTaskOnDate
                      ? `Click to add a task due on ${cell.dateStr}`
                      : undefined
                  }
                  role="gridcell"
                >
                  {/* Date number */}
                  <div className="cell-top-bar">
                    <span className={`cell-day-num ${cell.isToday ? "today-circle" : ""}`}>
                      {cell.date.getDate()}
                    </span>

                    {onAddTaskOnDate && cell.isCurrentMonth && (
                      <span className="cell-add-icon" aria-hidden="true">
                        +
                      </span>
                    )}
                  </div>

                  {/* Tasks on this day */}
                  <div className="cell-tasks-list">
                    {dayTasks.slice(0, 3).map((task) => {
                      const isCompleted = task.status === "Completed";
                      return (
                        <button
                          key={task.id}
                          type="button"
                          className={`cal-task-pill ${
                            isCompleted ? "pill-completed" : `pill-${task.priority.toLowerCase()}`
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                          }}
                          title={`${task.title} (${task.status}) - Priority: ${task.priority}`}
                          aria-label={`Edit task ${task.title}`}
                        >
                          <span className="cal-task-dot" aria-hidden="true" />
                          <span className="cal-task-text">{task.title}</span>
                        </button>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <span className="cal-more-chip">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unscheduled Tasks Sidebar */}
        <aside className="calendar-unscheduled-sidebar" aria-label="Unscheduled tasks">
          <div className="sidebar-header-row">
            <h3 className="unscheduled-title">Unscheduled Tasks</h3>
            <span className="unscheduled-count">{unscheduledTasks.length}</span>
          </div>
          <p className="unscheduled-desc">
            Tasks without a due date. Click any task to assign a deadline.
          </p>

          <div className="unscheduled-list">
            {unscheduledTasks.length === 0 ? (
              <p className="no-unscheduled-text">All tasks have deadlines assigned!</p>
            ) : (
              unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="unscheduled-item"
                  onClick={() => onEdit(task)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onEdit(task);
                    }
                  }}
                  title="Click to set due date"
                >
                  <div className="unscheduled-item-top">
                    <span className="unscheduled-item-title">{task.title}</span>
                    <span
                      className={`badge-pill badge-priority badge-priority-${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <span className="unscheduled-hint">+ Add due date</span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
