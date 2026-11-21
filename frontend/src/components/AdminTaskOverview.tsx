import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../adminAPI";
import type { AdminTaskItem } from "../types/admin";
import "./AdminTaskOverview.css";

export default function AdminTaskOverview() {
  const [tasks, setTasks] = useState<AdminTaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getTasks({
        q: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        page,
        page_size: pageSize,
      });
      setTasks(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system tasks");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <section className="admin-task-overview-root" aria-label="System Task Overview">
      {/* Header & Filter Controls */}
      <div className="task-overview-header-card">
        <div>
          <div className="task-overview-title-row">
            <h2 className="task-overview-title">System-wide Task Registry</h2>
            <span className="badge-task-count">{total} Total Tasks</span>
          </div>
          <p className="task-overview-subtitle">
            Audit all user tasks, track completion statuses, and identify overdue deliverables across Planova.
          </p>
        </div>

        <div className="task-overview-controls">
          {/* Search */}
          <div className="task-search-box">
            <svg
              className="search-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by title or owner..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search system tasks"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="task-table-card">
        {loading ? (
          <div className="task-table-loading" role="status">
            <div className="admin-spinner" />
            <p>Loading system tasks from database...</p>
          </div>
        ) : error ? (
          <div className="task-table-error" role="alert">
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={loadTasks}>
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="task-table-empty">
            <div className="empty-icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: "32px", height: "32px", color: "var(--muted)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3>No tasks match your criteria</h3>
            <p>Try searching with different terms or resetting filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="planova-admin-table">
              <thead>
                <tr>
                  <th scope="col">Task Title</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Status</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Due Date</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isDone = task.status === "Completed";
                  const isOverdue =
                    task.due_date &&
                    !isDone &&
                    new Date(task.due_date).setHours(0, 0, 0, 0) <
                      new Date().setHours(0, 0, 0, 0);

                  return (
                    <tr key={task.id}>
                      {/* Title & Description */}
                      <td className="task-col-title">
                        <div className="task-meta-cell">
                          <span className={`task-cell-title ${isDone ? "is-done" : ""}`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="task-cell-desc">{task.description}</span>
                          )}
                        </div>
                      </td>

                      {/* Owner */}
                      <td>
                        <div className="owner-cell">
                          <span className="owner-name">{task.owner.name}</span>
                          <span className="owner-email">{task.owner.email}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge-pill badge-status badge-${task.status.toLowerCase()}`}>
                          {task.status === "InProgress" ? "In Progress" : task.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td>
                        <span
                          className={`badge-pill badge-priority badge-priority-${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td>
                        {task.due_date ? (
                          <span className={`due-date-cell ${isOverdue ? "is-overdue" : ""}`}>
                            {task.due_date}
                          </span>
                        ) : (
                          <span className="no-date">No date</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td>
                        <span className="created-date-cell">
                          {new Date(task.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="table-pagination-bar">
            <span className="pagination-info">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} tasks
            </span>

            <div className="pagination-buttons">
              <button
                type="button"
                className="btn-page"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                &larr; Previous
              </button>

              <span className="page-current">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="btn-page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
