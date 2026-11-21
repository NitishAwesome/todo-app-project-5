import { useCallback, useEffect, useMemo, useState } from "react";
import { taskApi, categoryApi } from "../taskAPI";
import { tagApi } from "../productivityAPI";
import type { Task, TaskStatus, Category } from "../types/task";
import type { Tag } from "../types/productivity";
import TaskCard from "./TaskCard";
import TaskToolbar, {
  DEFAULT_FILTERS,
  type StatusFilter,
  type TaskFilters,
} from "./TaskToolbar";
import "./TaskDisplay.css";

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

interface TaskWorkspaceProps {
  onEdit: (task: Task) => void;
  onAddTask?: () => void;
  initialStatusFilter?: StatusFilter;
}

export default function TaskWorkspace({
  onEdit,
  onAddTask,
  initialStatusFilter,
}: TaskWorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<TaskFilters>(() => ({
    ...DEFAULT_FILTERS,
    status: initialStatusFilter ?? "All",
  }));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Keep filters in sync if parent changes initialStatusFilter
  useEffect(() => {
    if (initialStatusFilter) {
      setFilters((prev) => ({ ...prev, status: initialStatusFilter }));
    }
  }, [initialStatusFilter]);

  // Load tasks, categories, and tags from FastAPI
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [fetchedTasks, fetchedCategories, fetchedTags] = await Promise.all([
        taskApi.getAll(),
        categoryApi.getAll().catch(() => [] as Category[]),
        tagApi.getAll().catch(() => [] as Tag[]),
      ]);
      setTasks(fetchedTasks);
      setCategories(fetchedCategories);
      setTags(fetchedTags);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build a lookup map of category ID -> Name
  const categoriesMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of categories) {
      map[c.id] = c.name;
    }
    return map;
  }, [categories]);

  // Handle status update (e.g. checkbox or status select)
  async function handleStatusChange(task: Task, status: TaskStatus) {
    setActionError("");
    setActionSuccess("");
    try {
      const updated = await taskApi.update(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      setActionSuccess(
        status === "Completed"
          ? `Completed "${task.title}". Great work!`
          : `Moved "${task.title}" to ${status}.`
      );
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update task status");
    }
  }

  // Handle task deletion with accessible confirmation
  async function handleDelete(task: Task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?\n\nThis will permanently remove the task.`
    );
    if (!confirmed) return;

    setActionError("");
    try {
      await taskApi.remove(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setActionSuccess(`Deleted "${task.title}".`);
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  // Calculate real status counts for toolbar tabs
  const counts = useMemo<Record<StatusFilter, number>>(
    () => ({
      All: tasks.length,
      Pending: tasks.filter((t) => t.status === "Pending").length,
      InProgress: tasks.filter((t) => t.status === "InProgress").length,
      Completed: tasks.filter((t) => t.status === "Completed").length,
    }),
    [tasks]
  );

  // Filter and sort the tasks list
  const visibleTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = tasks.filter((t) => {
      // 1. Status Filter
      if (filters.status !== "All" && t.status !== filters.status) {
        return false;
      }

      // 2. Priority Filter
      if (filters.priority !== "All" && t.priority !== filters.priority) {
        return false;
      }

      // 3. Category Filter
      if (filters.categoryId !== "all" && t.category_id !== filters.categoryId) {
        return false;
      }

      // 4. Tag Filter
      if (filters.tagId !== "all") {
        const taskTags = t.tags || [];
        if (!taskTags.some((tag) => tag.id === filters.tagId)) {
          return false;
        }
      }

      // 5. Due Date Filter
      if (filters.dueDate !== "all") {
        if (!t.due_date) return false;
        const [y, m, d] = t.due_date.slice(0, 10).split("-").map(Number);
        const due = new Date(y, m - 1, d);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (filters.dueDate === "overdue") {
          if (t.status === "Completed" || diffDays >= 0) return false;
        } else if (filters.dueDate === "today") {
          if (diffDays !== 0) return false;
        } else if (filters.dueDate === "week") {
          if (diffDays < 0 || diffDays > 7) return false;
        }
      }

      // 6. Search Filter (searches both title and description)
      if (search !== "") {
        const titleMatch = t.title.toLowerCase().includes(search);
        const descMatch = t.description ? t.description.toLowerCase().includes(search) : false;
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (filters.sort === "priority") {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      if (filters.sort === "dueDate") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      if (filters.sort === "title") {
        return a.title.localeCompare(b.title);
      }
      // default: newest first
      return b.created_at.localeCompare(a.created_at);
    });
  }, [tasks, filters]);

  // Loading state
  if (loading) {
    return (
      <div className="planova-workspace-loading" role="status">
        <div className="workspace-spinner" />
        <p>Loading your tasks and categories...</p>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="planova-workspace-error" role="alert">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <h3>Failed to load tasks</h3>
        <p>{loadError}</p>
        <button type="button" className="btn-retry" onClick={loadData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="planova-task-workspace">
      {/* Toast Alert Notifications */}
      {actionSuccess && (
        <div className="workspace-banner workspace-banner-success" role="status">
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess("")}>
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="workspace-banner workspace-banner-error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError("")}>
            &times;
          </button>
        </div>
      )}

      {/* Toolbar & Filters */}
      <TaskToolbar
        filters={filters}
        counts={counts}
        categories={categories}
        tags={tags}
        onChange={setFilters}
      />

      {/* Visible Tasks List */}
      {visibleTasks.length === 0 ? (
        <div className="workspace-empty-state">
          <div className="empty-icon-wrap" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3>No tasks match your criteria</h3>
          <p>
            {tasks.length === 0
              ? "You haven't created any tasks yet. Click below to add your first task."
              : "Try adjusting your search query, status tabs, or filters."}
          </p>
          {onAddTask && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAddTask}
            >
              + Create First Task
            </button>
          )}
        </div>
      ) : (
        <ul className="planova-tasks-list" aria-label="Tasks list">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              categoriesMap={categoriesMap}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
