import { useState, useEffect, useCallback, useMemo } from "react";
import { adminApi } from "../adminAPI";
import type { AdminUserItem } from "../types/admin";
import { useAuth } from "../context/AuthContext";
import "./AdminUserManagement.css";

export default function AdminUserManagement() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  // Load users from backend
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getUsers({
        q: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        page,
        page_size: pageSize,
      });
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users list");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Role Change (Promote to Admin or Demote to User)
  const handleToggleRole = async (targetUser: AdminUserItem) => {
    const nextRole = targetUser.role === "Admin" ? "User" : "Admin";

    if (targetUser.id === currentAdmin?.id && nextRole === "User") {
      alert("You cannot remove Admin privileges from your own account.");
      return;
    }

    const actionText = nextRole === "Admin" ? "promote to Administrator" : "demote to Regular User";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} for "${targetUser.name}" (${targetUser.email})?`
    );
    if (!confirmed) return;

    setActionInProgress(targetUser.id);
    try {
      const updated = await adminApi.updateUserRole(targetUser.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      setToastMessage(`Successfully updated role for ${targetUser.name} to ${nextRole}.`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user role");
    } finally {
      setActionInProgress(null);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section className="admin-user-mgmt-root" aria-label="User Management Portal">
      {/* Toast */}
      {toastMessage && (
        <div className="user-mgmt-toast toast-success" role="status">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage("")}>
            &times;
          </button>
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div className="user-mgmt-header-card">
        <div>
          <div className="user-mgmt-title-row">
            <h2 className="user-mgmt-title">User Accounts Administration</h2>
            <span className="badge-user-count">{total} Total Accounts</span>
          </div>
          <p className="user-mgmt-subtitle">
            Manage authorization roles, inspect user task engagement, and oversee account access.
          </p>
        </div>

        <div className="user-mgmt-controls">
          {/* Search Input */}
          <div className="user-search-box">
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
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search users"
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

          {/* Role Filter */}
          <select
            className="user-role-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Administrators Only</option>
            <option value="User">Regular Users Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="user-table-card">
        {loading ? (
          <div className="user-table-loading" role="status">
            <div className="admin-spinner" />
            <p>Loading users from database...</p>
          </div>
        ) : error ? (
          <div className="user-table-error" role="alert">
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={loadUsers}>
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="user-table-empty">
            <div className="empty-icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ width: "32px", height: "32px", color: "var(--muted)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3>No users found</h3>
            <p>Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="planova-admin-table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Role</th>
                  <th scope="col">Registered</th>
                  <th scope="col">Task Activity</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrent = u.id === currentAdmin?.id;
                  const isAdmin = u.role === "Admin";
                  const isBusy = actionInProgress === u.id;

                  return (
                    <tr key={u.id} className={isCurrent ? "row-current-user" : ""}>
                      {/* Name & Avatar */}
                      <td>
                        <div className="user-cell-meta">
                          <div className={`user-avatar ${isAdmin ? "avatar-admin" : ""}`}>
                            <span>{getInitials(u.name)}</span>
                          </div>
                          <div>
                            <div className="user-cell-name">
                              <span>{u.name}</span>
                              {isCurrent && <span className="pill-you">You</span>}
                            </div>
                            <span className="user-cell-email">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td>
                        <span className={`role-pill ${isAdmin ? "role-admin" : "role-user"}`}>
                          {isAdmin ? "Admin" : "User"}
                        </span>
                      </td>

                      {/* Created At */}
                      <td>
                        <span className="date-cell">
                          {new Date(u.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Task Metrics */}
                      <td>
                        <div className="task-metric-cell">
                          <span className="metric-total">{u.task_count} total tasks</span>
                          <span className="metric-completed">
                            ({u.completed_task_count} completed)
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          type="button"
                          className={`btn-role-toggle ${isAdmin ? "btn-demote" : "btn-promote"}`}
                          disabled={isCurrent || isBusy}
                          onClick={() => handleToggleRole(u)}
                          title={
                            isCurrent
                              ? "Cannot change your own role"
                              : isAdmin
                              ? "Demote to User"
                              : "Promote to Admin"
                          }
                        >
                          {isBusy
                            ? "Updating..."
                            : isAdmin
                            ? "Demote to User"
                            : "Promote to Admin"}
                        </button>
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
              {Math.min(page * pageSize, total)} of {total} accounts
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
