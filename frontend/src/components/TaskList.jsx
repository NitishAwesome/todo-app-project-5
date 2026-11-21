import { useEffect, useState } from "react";
import { getTasks, updateTaskStatus, deleteTask } from "../api";
import TaskItem from "./TaskItem";
import TaskFilter from "./TaskFilter";
import "./TaskDisplay.css";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(task) {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await updateTaskStatus(task.id, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  const visibleTasks = tasks.filter(
    (t) => filter === "All" || t.status === filter
  );

  if (loading) return <p>Loading tasks...</p>;

  return (
    <section className="task-list">
      <h2>My Tasks</h2>
      {error && <p className="error">{error}</p>}
      <TaskFilter current={filter} onChange={setFilter} />
      {visibleTasks.length === 0 ? (
        <p> NO TASK FOUND.</p>
      ) : (
        <ul>
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}