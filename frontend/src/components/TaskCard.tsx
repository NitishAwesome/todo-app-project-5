import type { Task, TaskStatus } from "../types/task";

const STATUS_LABELS: Record<TaskStatus, string> = {
  Pending: "Pending",
  InProgress: "In Progress",
  Completed: "Completed",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TaskStatus[];

interface TaskCardProps {
  task: Task;
  categoriesMap?: Record<number, string>;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({
  task,
  categoriesMap = {},
  onStatusChange,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const isDone = task.status === "Completed";
  const categoryName = task.category_id ? categoriesMap[task.category_id] : null;

  // Calculate due date status (overdue, due today, due soon)
  const getDueStatus = () => {
    if (!task.due_date) return null;
    if (isDone) return { type: "done", label: task.due_date.slice(0, 10) };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = task.due_date.slice(0, 10).split("-").map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        type: "overdue",
        label: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"}`,
      };
    } else if (diffDays === 0) {
      return { type: "today", label: "Due Today" };
    } else if (diffDays === 1) {
      return { type: "soon", label: "Due Tomorrow" };
    }
    return { type: "future", label: task.due_date.slice(0, 10) };
  };

  const dueStatus = getDueStatus();

  // Subtasks progress calculations
  const subtasks = task.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Custom tags
  const tags = task.tags || [];

  const handleToggleComplete = () => {
    const nextStatus: TaskStatus = isDone ? "Pending" : "Completed";
    onStatusChange(task, nextStatus);
  };

  return (
    <li className={`planova-task-card ${isDone ? "is-completed" : ""}`}>
      {/* Complete toggle checkbox button */}
      <button
        type="button"
        className={`task-checkbox ${isDone ? "checked" : ""}`}
        onClick={handleToggleComplete}
        title={isDone ? "Mark as Pending (Reopen)" : "Mark as Completed"}
        aria-label={isDone ? `Reopen ${task.title}` : `Complete ${task.title}`}
      >
        {isDone ? (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <span className="checkbox-dot" />
        )}
      </button>

      {/* Main Task Information */}
      <div className="task-body">
        <div className="task-header-line">
          <h3 className="task-title" title={task.title} onClick={() => onEdit(task)}>
            {task.title}
          </h3>

          <div className="task-badges-row">
            {/* Category badge */}
            {categoryName && (
              <span className="badge-pill badge-category" title={`Category: ${categoryName}`}>
                {categoryName}
              </span>
            )}

            {/* Priority badge */}
            <span
              className={`badge-pill badge-priority badge-priority-${task.priority.toLowerCase()}`}
            >
              {task.priority}
            </span>

            {/* Status badge */}
            <span className={`badge-pill badge-status badge-${task.status.toLowerCase()}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
        </div>

        {/* Optional Description */}
        {task.description && <p className="task-description">{task.description}</p>}

        {/* Tags Row */}
        {tags.length > 0 && (
          <div className="task-tags-row">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="task-tag-chip"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}35`,
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta Line: Subtasks progress, due date, timestamps */}
        <div className="task-meta-line">
          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <div
              className={`task-subtasks-indicator ${completedSubtasks === totalSubtasks ? "all-done" : ""}`}
              title={`${completedSubtasks} of ${totalSubtasks} subtasks completed (${subtasksPercent}%)`}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="subtask-check-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="subtasks-count">
                {completedSubtasks}/{totalSubtasks}
              </span>
              <div className="subtasks-mini-bar" aria-hidden="true">
                <div
                  className="subtasks-mini-fill"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>
            </div>
          )}

          {dueStatus && (
            <div className={`due-pill due-${dueStatus.type}`}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <span>{dueStatus.label}</span>
            </div>
          )}

          {!task.due_date && <span className="no-due">No deadline</span>}

          <span className="meta-separator">•</span>
          <span className="created-text">
            Added {new Date(task.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Controls & Action Buttons */}
      <div className="task-actions">
        {/* Status Quick Select */}
        <select
          className="task-status-select"
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
          aria-label={`Change status for ${task.title}`}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        {/* Edit Button */}
        <button
          type="button"
          className="action-icon-btn edit"
          onClick={() => onEdit(task)}
          title="Edit task & view details"
          aria-label={`Edit task ${task.title}`}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
          <span className="btn-label">Edit</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          className="action-icon-btn delete"
          onClick={() => onDelete(task)}
          title="Delete task"
          aria-label={`Delete task ${task.title}`}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
