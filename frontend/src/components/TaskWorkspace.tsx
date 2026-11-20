import { useCallback, useEffect, useMemo, useState } from "react";
import { taskApi } from "../taskApi";
import type { Task, TaskStatus } from "../types/task";
import TaskCard from "./TaskCard";
import TaskToolbar, {
  DEFAULT_FILTERS,
  type StatusFilter,
  type TaskFilters,
} from "./TaskToolbar";
import "./TaskDisplay.css";

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

interface TaskWorkspaceProps {
  // Called when the user clicks Edit. The Add/Edit form owner handles it.
  onEdit: (task: Task) => void;
}

export default function TaskWorkspace({ onEdit }: TaskWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setTasks(await taskApi.getAll());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleStatusChange(task: Task, status: TaskStatus) {
    setActionError("");
    try {
      const updated = await taskApi.update(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update task");
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setActionError("");
    try {
      await taskApi.remove(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  // Real counts calculated from the loaded tasks.
  const counts = useMemo<Record<StatusFilter, number>>(
    () => ({
      All: tasks.length,
      Pending: tasks.filter((t) => t.status === "Pending").length,
      InProgress: tasks.filter((t) => t.status === "InProgress").length,
      Completed: tasks.filter((t) => t.status === "Completed").length,
    }),
    [tasks]
  );

  const visibleTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    const filtered = tasks.filter(
      (t) =>
        (filters.status === "All" || t.status === filters.status) &&
        (filters.priority === "All" || t.priority === filters.priority) &&
        (search === "" || t.title.toLowerCase().includes(search))
    );

    return [...filtered].sort((a, b) => {
      if (filters.sort === "priority") {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      if (filters.sort === "dueDate") {
        // Tasks without a due date go last.
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      // newest first
      return b.created_at.localeCompare(a.created_at);
    });
  }, [tasks, filters]);

  if (loading) return <p>Loading tasks...</p>;

  // A failed request is NOT an empty list, so show the error and Retry.
  if (loadError) {
    return (
      <section className="task-list">
        <h2>My Tasks</h2>
        <p className="error">{loadError}</p>
        <button className="filter-btn" onClick={loadTasks}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="task-list">
      <h2>My Tasks</h2>
      {actionError && <p className="error">{actionError}</p>}

      <TaskToolbar filters={filters} counts={counts} onChange={setFilters} />

      {visibleTasks.length === 0 ? (
        <p>
          {tasks.length === 0
            ? "You have no tasks yet."
            : "No tasks match your filters."}
        </p>
      ) : (
        <ul>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </section>
  );
}