import type { Task, TaskStatus } from "../types/task";

const STATUS_LABELS: Record<TaskStatus, string> = {
  Pending: "Pending",
  InProgress: "In Progress",
  Completed: "Completed",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as TaskStatus[];

interface TaskCardProps {
  task: Task;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const done = task.status === "Completed";

  return (
    <li className={done ? "task-item done" : "task-item"}>
      <div className="task-info">
        <span className="task-title">{task.title}</span>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <small>
          Priority: {task.priority} | Due: {task.due_date ?? "No due date"}
        </small>
      </div>

      <span className={`badge badge-${task.status.toLowerCase()}`}>
        {STATUS_LABELS[task.status]}
      </span>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <button className="edit-btn" onClick={() => onEdit(task)}>
        Edit
      </button>
      <button className="delete-btn" onClick={() => onDelete(task)}>
        Delete
      </button>
    </li>
  );
}