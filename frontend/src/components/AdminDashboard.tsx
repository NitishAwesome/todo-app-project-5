import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../adminAPI";
import { teamApi } from "../teamAPI";
import type { AdminStats } from "../types/admin";
import type { TeamAnalytics } from "../types/team";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

interface AdminDashboardProps {
  onNavigateUsers: () => void;
  onNavigateTasks: () => void;
  onNavigatePersonal: () => void;
  onNavigateAssignments?: () => void;
}

export default function AdminDashboard({
  onNavigateUsers,
  onNavigateTasks,
  onNavigatePersonal,
  onNavigateAssignments,
}: AdminDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, teamData] = await Promise.all([
        adminApi.getStats(),
        teamApi.getTeamAnalytics().catch(() => null),
      ]);
      setStats(data);
      setTeamAnalytics(teamData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="admin-loading-container" role="status">
        <div className="admin-spinner" />
        <p>Loading administrative telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-box" role="alert">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <h3>Failed to load Admin Dashboard</h3>
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={loadStats}>
          Retry Connection
        </button>
      </div>
    );
  }

  const s = stats ?? {
    total_users: 0,
    total_tasks: 0,
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    completion_rate: 0,
    tasks_by_priority: { High: 0, Medium: 0, Low: 0 },
    tasks_by_status: { Pending: 0, InProgress: 0, Completed: 0 },
  };

  const highPct = s.total_tasks > 0 ? Math.round((s.tasks_by_priority.High / s.total_tasks) * 100) : 0;
  const medPct = s.total_tasks > 0 ? Math.round((s.tasks_by_priority.Medium / s.total_tasks) * 100) : 0;
  const lowPct = s.total_tasks > 0 ? Math.round((s.tasks_by_priority.Low / s.total_tasks) * 100) : 0;

  return (
    <section className="admin-dashboard-root" aria-label="Administrator Portal Dashboard">
      {/* Welcome & Admin Banner */}
      <div className="admin-header-card">
        <div className="admin-header-meta">
          <div className="admin-title-row">
            <h1 className="admin-title">Welcome back, {user?.name || "Admin"}</h1>
            <span className="badge-admin-crown">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-6.75-6.75l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                />
              </svg>
              <span>Verified Administrator</span>
            </span>
          </div>
          <p className="admin-subtitle">
            System-wide task telemetry, user administration, and operational metrics for Planova.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary admin-btn-action"
            onClick={onNavigatePersonal}
          >
            Switch to Personal Workspace
          </button>
          <button
            type="button"
            className="btn btn-primary admin-btn-action"
            onClick={onNavigateUsers}
          >
            Manage Users
          </button>
        </div>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="admin-kpi-grid">
        {/* Card 1: Total Users */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="kpi-label">Registered Users</span>
            <div className="kpi-icon-pill icon-users" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{s.total_users}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-primary">Live Data</span>
            <span className="kpi-desc">Total user accounts</span>
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="kpi-label">System Tasks</span>
            <div className="kpi-icon-pill icon-tasks" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{s.total_tasks}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-info">{s.completion_rate}% Completed</span>
            <span className="kpi-desc">Across all workspaces</span>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="kpi-label">Pending Tasks</span>
            <div className="kpi-icon-pill icon-pending" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{s.pending_tasks}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-warning">Backlog</span>
            <span className="kpi-desc">Awaiting execution</span>
          </div>
        </div>

        {/* Card 4: In Progress */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="kpi-label">In Progress</span>
            <div className="kpi-icon-pill icon-inprogress" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{s.in_progress_tasks}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-purple">Active</span>
            <span className="kpi-desc">Currently in flight</span>
          </div>
        </div>

        {/* Card 5: Completed */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="kpi-label">Completed Tasks</span>
            <div className="kpi-icon-pill icon-completed" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{s.completed_tasks}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-success">Delivered</span>
            <span className="kpi-desc">Milestones reached</span>
          </div>
        </div>

        {/* Card 6: Overdue */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="kpi-label">Overdue Tasks</span>
            <div className="kpi-icon-pill icon-overdue" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{s.overdue_tasks}</div>
          <div className="kpi-footer">
            <span className={`kpi-tag ${s.overdue_tasks > 0 ? "tag-danger" : "tag-success"}`}>
              {s.overdue_tasks > 0 ? "Needs Attention" : "All On Track"}
            </span>
            <span className="kpi-desc">Past due date</span>
          </div>
        </div>
      </div>

      {/* Analytics & System Health Visual Grid */}
      <div className="admin-analytics-grid">
        {/* Panel 1: System Task Status Distribution */}
        <div className="admin-panel-card">
          <div className="panel-header-line">
            <div>
              <h2 className="panel-title">System-wide Task Distribution</h2>
              <p className="panel-subtitle">Current status breakdown across all users</p>
            </div>
            <button
              type="button"
              className="btn-panel-action"
              onClick={onNavigateTasks}
            >
              Inspect Tasks &rarr;
            </button>
          </div>

          <div className="completion-ring-section">
            <div className="ring-container">
              <svg className="ring-svg" viewBox="0 0 120 120">
                <circle
                  className="ring-bg"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="12"
                />
                <circle
                  className="ring-progress"
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="12"
                  strokeDasharray={314}
                  strokeDashoffset={314 - (314 * s.completion_rate) / 100}
                />
              </svg>
              <div className="ring-inner-text">
                <span className="ring-percent">{s.completion_rate}%</span>
                <span className="ring-caption">Overall</span>
              </div>
            </div>

            <div className="ring-breakdown-list">
              <div className="breakdown-item">
                <div className="breakdown-label-row">
                  <span className="status-badge-dot dot-completed" />
                  <span className="breakdown-name">Completed</span>
                  <span className="breakdown-count">{s.completed_tasks}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill fill-completed"
                    style={{
                      width: `${s.total_tasks > 0 ? (s.completed_tasks / s.total_tasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label-row">
                  <span className="status-badge-dot dot-inprogress" />
                  <span className="breakdown-name">In Progress</span>
                  <span className="breakdown-count">{s.in_progress_tasks}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill fill-inprogress"
                    style={{
                      width: `${s.total_tasks > 0 ? (s.in_progress_tasks / s.total_tasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-label-row">
                  <span className="status-badge-dot dot-pending" />
                  <span className="breakdown-name">Pending</span>
                  <span className="breakdown-count">{s.pending_tasks}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill fill-pending"
                    style={{
                      width: `${s.total_tasks > 0 ? (s.pending_tasks / s.total_tasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Priority Breakdown */}
        <div className="admin-panel-card">
          <div className="panel-header-line">
            <div>
              <h2 className="panel-title">Tasks by Priority</h2>
              <p className="panel-subtitle">Resource allocation and urgency classification</p>
            </div>
          </div>

          <div className="priority-bars-container">
            {/* High */}
            <div className="priority-row-item">
              <div className="priority-row-header">
                <span className="priority-badge-pill pill-high">High Priority</span>
                <span className="priority-count-meta">
                  {s.tasks_by_priority.High} tasks ({highPct}%)
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-high"
                  style={{ width: `${highPct}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="priority-row-item">
              <div className="priority-row-header">
                <span className="priority-badge-pill pill-med">Medium Priority</span>
                <span className="priority-count-meta">
                  {s.tasks_by_priority.Medium} tasks ({medPct}%)
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-med"
                  style={{ width: `${medPct}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="priority-row-item">
              <div className="priority-row-header">
                <span className="priority-badge-pill pill-low">Low Priority</span>
                <span className="priority-count-meta">
                  {s.tasks_by_priority.Low} tasks ({lowPct}%)
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-low"
                  style={{ width: `${lowPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="admin-quick-links-box">
            {onNavigateAssignments && (
              <div className="quick-link-tile" onClick={onNavigateAssignments} style={{ borderColor: "var(--primary)" }}>
                <div className="tile-icon-box" style={{ background: "rgba(99, 102, 241, 0.12)", color: "var(--primary)" }}>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="tile-title">Team Task Assignments</h3>
                  <p className="tile-desc">
                    {teamAnalytics ? `${teamAnalytics.active_assignments} in-progress assignments` : "Assign tasks & track members"}
                  </p>
                </div>
                <span className="tile-arrow">&rarr;</span>
              </div>
            )}

            <div className="quick-link-tile" onClick={onNavigateUsers}>
              <div className="tile-icon-box">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h3 className="tile-title">Manage User Accounts</h3>
                <p className="tile-desc">Inspect, promote, or manage roles</p>
              </div>
              <span className="tile-arrow">&rarr;</span>
            </div>

            <div className="quick-link-tile" onClick={onNavigateTasks}>
              <div className="tile-icon-box">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div>
                <h3 className="tile-title">System Task Overview</h3>
                <p className="tile-desc">Audit all tasks, statuses &amp; deadlines</p>
              </div>
              <span className="tile-arrow">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
