import { useState, useMemo, useEffect, useCallback } from "react";
import { taskApi, categoryApi } from "../taskAPI";
import type { Task, TaskStatus, Category } from "../types/task";
import "./KanbanBoard.css";

const COLUMNS: { id: TaskStatus; title: string; color: string; dotClass: string }[] = [
  { id: "Pending", title: "Pending", color: "#f59e0b", dotClass: "dot-pending" },
  { id: "InProgress", title: "In Progress", color: "#6366f1", dotClass: "dot-inprogress" },
  { id: "Completed", title: "Completed", color: "#10b981", dotClass: "dot-completed" },
];

interface KanbanBoardProps {
  onEdit: (task: Task) => void;
  onAddTaskWithStatus?: (status: TaskStatus) => void;
}

export default function KanbanBoard({ onEdit, onAddTaskWithStatus }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  // Dragging state
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Fetch tasks and categories
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
      setError(err instanceof Error ? err.message : "Failed to load Kanban tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categoriesMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of categories) {
      map[c.id] = c.name;
    }
    return map;
  }, [categories]);

  // Handle task status update (Optimistic UI update)
  const handleMoveStatus = async (taskId: number, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === newStatus) return;

    const previousStatus = targetTask.status;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setToastMessage(`Moved "${targetTask.title}" to ${newStatus}`);
    setTimeout(() => setToastMessage(""), 3000);

    try {
      await taskApi.update(taskId, { status: newStatus });
    } catch (err) {
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      setError(
        err instanceof Error
          ? err.message
          : `Failed to move task. Reverted back to ${previousStatus}.`
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  // Delete task with accessible confirmation
  const handleDelete = async (task: Task) => {
    const confirmed = window.confirm(
      `Delete task "${task.title}"?\n\nThis will permanently remove it from your workspace.`
    );
    if (!confirmed) return;

    try {
      await taskApi.remove(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setToastMessage(`Deleted "${task.title}".`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  // Drag and Drop event handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", String(taskId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData("text/plain");
    const taskId = taskIdStr ? Number(taskIdStr) : draggedTaskId;
    setDraggedTaskId(null);

    if (taskId) {
      handleMoveStatus(taskId, newStatus);
    }
  };

  // Filter tasks for the board
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (selectedCategory !== "all" && t.category_id !== selectedCategory) {
        return false;
      }
      if (q !== "") {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = t.description ? t.description.toLowerCase().includes(q) : false;
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="planova-workspace-loading" role="status">
        <div className="workspace-spinner" />
        <p>Loading Kanban Board...</p>
      </div>
    );
  }

  return (
    <section className="planova-kanban-section" aria-label="Kanban Task Board">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="kanban-toast toast-success" role="status">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage("")}>
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="kanban-toast toast-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            &times;
          </button>
        </div>
      )}

      {/* Header & Quick Filter Toolbar */}
      <div className="kanban-header-bar">
        <div>
          <h2 className="kanban-title">Planova Kanban Board</h2>
          <p className="kanban-subtitle">
            Drag cards between columns or use the quick move menu to update task status.
          </p>
        </div>

        <div className="kanban-toolbar-actions">
          <input
            type="text"
            className="kanban-search-input"
            placeholder="Search Kanban tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter Kanban tasks"
          />

          <select
            className="kanban-category-select"
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban 3-Column Layout */}
      <div className="kanban-board-grid">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${isOver ? "drag-over" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="kanban-col-left">
                  <span className={`status-dot ${col.dotClass}`} aria-hidden="true" />
                  <h3 className="kanban-col-title">{col.title}</h3>
                  <span className="kanban-col-count">{colTasks.length}</span>
                </div>

                {onAddTaskWithStatus && (
                  <button
                    type="button"
                    className="kanban-add-col-btn"
                    onClick={() => onAddTaskWithStatus(col.id)}
                    title={`Add task to ${col.title}`}
                    aria-label={`Add task to ${col.title}`}
                  >
                    +
                  </button>
                )}
              </div>

              {/* Tasks in Column */}
              <div className="kanban-card-list">
                {colTasks.length === 0 ? (
                  <div className="kanban-empty-column">
                    <p>No {col.title.toLowerCase()} tasks</p>
                    <span className="kanban-drop-hint">Drop tasks here</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const catName = task.category_id ? categoriesMap[task.category_id] : null;

                    // Due date calculations
                    const isOverdue =
                      task.due_date &&
                      task.status !== "Completed" &&
                      new Date(task.due_date).setHours(0, 0, 0, 0) <
                        new Date().setHours(0, 0, 0, 0);

                    return (
                      <div
                        key={task.id}
                        className={`kanban-task-card ${
                          draggedTaskId === task.id ? "is-dragging" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        {/* Card Header: Category & Priority */}
                        <div className="kanban-card-top">
                          {catName ? (
                            <span className="kanban-badge-cat">{catName}</span>
                          ) : (
                            <span className="kanban-badge-empty">General</span>
                          )}

                          <span
                            className={`badge-pill badge-priority badge-priority-${task.priority.toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="kanban-card-title">{task.title}</h4>

                        {/* Description snippet */}
                        {task.description && (
                          <p className="kanban-card-desc">{task.description}</p>
                        )}

                        {/* Meta: Due Date */}
                        <div className="kanban-card-meta">
                          {task.due_date ? (
                            <span
                              className={`kanban-due ${isOverdue ? "due-overdue" : ""}`}
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "13px", height: "13px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                              </svg>
                              <span>{task.due_date.slice(0, 10)}</span>
                            </span>
                          ) : (
                            <span className="kanban-no-due">No deadline</span>
                          )}
                        </div>

                        {/* Card Footer: Quick Move Selector & Actions */}
                        <div className="kanban-card-actions">
                          {/* Accessible Move Dropdown */}
                          <div className="kanban-move-box">
                            <span className="move-label">Move:</span>
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleMoveStatus(task.id, e.target.value as TaskStatus)
                              }
                              aria-label={`Move ${task.title} to status`}
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="kanban-btn-group">
                            <button
                              type="button"
                              className="kanban-mini-btn"
                              onClick={() => onEdit(task)}
                              title="Edit task"
                              aria-label={`Edit ${task.title}`}
                            >
                              <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              className="kanban-mini-btn delete"
                              onClick={() => handleDelete(task)}
                              title="Delete task"
                              aria-label={`Delete ${task.title}`}
                            >
                              <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
