export default function TaskItem({ task, onToggle, onDelete }) {
  const done = task.status === "Completed";

  return (
    <li className={done ? "task-item done" : "task-item"}>
      <input type="checkbox" checked={done} onChange={() => onToggle(task)} />
      <div className="task-info">
        <span className="task-title">{task.title}</span>
        <small>
          Priority: {task.priority} | Due: {task.due_date}
        </small>
      </div>
      <span className={done ? "badge badge-completed" : "badge badge-pending"}>
        {task.status}
      </span>
      <button className="delete-btn" onClick={() => onDelete(task.id)}>
        Delete
      </button>
    </li>
  );
}