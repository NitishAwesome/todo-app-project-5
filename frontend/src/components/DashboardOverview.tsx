import { useMemo } from "react";
import type { Task, TaskStatus } from "../types/task";
import { useAuth } from "../context/AuthContext";
import "./DashboardOverview.css";

interface DashboardOverviewProps {
  tasks: Task[];
  loading: boolean;
  error?: string;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onViewAll: () => void;
  onViewCompleted: () => void;
  onRetry?: () => void;
}

export default function DashboardOverview({
  tasks,
  loading,
  error,
  onAddTask,
  onEditTask,
  onStatusChange,
  onViewAll,
  onViewCompleted,
  onRetry,
}: DashboardOverviewProps) {
  const { user } = useAuth();

  // Current formatted date
  const formattedDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Calculated Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "Pending").length;
    const inProgress = tasks.filter((t) => t.status === "InProgress").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;

    const now = new Date();
    const overdue = tasks.filter((t) => {
      if (t.status === "Completed" || !t.due_date) return false;
      const due = new Date(t.due_date + "T23:59:59");
      return due < now;
    }).length;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const highPriority = tasks.filter((t) => t.priority === "High").length;
    const medPriority = tasks.filter((t) => t.priority === "Medium").length;
    const lowPriority = tasks.filter((t) => t.priority === "Low").length;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      percent,
      highPriority,
      medPriority,
      lowPriority,
    };
  }, [tasks]);

  // Weekly Activity (Tasks created or completed across the past 7 days)
  const weeklyActivity = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = dayNames[d.getDay()];

      const count = tasks.filter((t) => {
        const matchesCreated = t.created_at && t.created_at.slice(0, 10) === dateStr;
        const matchesDue = t.due_date && t.due_date === dateStr;
        return matchesCreated || matchesDue;
      }).length;

      days.push({
        date: dateStr,
        day: dayLabel,
        isToday: i === 0,
        count,
      });
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount };
  }, [tasks]);

  // Today's / Upcoming Tasks (sorted by due date, incomplete first)
  const upcomingTasks = useMemo(() => {
    const incomplete = tasks.filter((t) => t.status !== "Completed" && t.due_date);
    return [...incomplete]
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 5);
  }, [tasks]);

  // Recent Tasks (sorted by created_at / id descending)
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return (
      <div className="dash-empty-state" style={{ minHeight: "360px", justifyContent: "center" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            border: "3px solid #e2e8f0",
            borderTopColor: "#4f46e5",
            borderRadius: "50%",
            animation: "dash-spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#64748b", fontWeight: 600 }}>Loading your live Planova analytics...</p>
        <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-empty-state" style={{ minHeight: "360px", justifyContent: "center" }}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{ color: "#ef4444" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 7.5h.008v.008H12v-.008z" />
        </svg>
        <h3 style={{ color: "#0f172a", fontSize: "1.2rem", fontWeight: 700 }}>Unable to load dashboard data</h3>
        <p style={{ color: "#ef4444", maxWidth: "400px" }}>{error}</p>
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry} style={{ marginTop: "12px" }}>
            Retry
          </button>
        )}
      </div>
    );
  }

  // Circular progress calculations for doughnut ring
  const circleRadius = 52;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circumference - (stats.percent / 100) * circumference;

  return (
    <div className="dashboard-container">
      {/* ========================================================
          A. WELCOME HERO HEADER
          ======================================================== */}
      <section className="dash-hero" aria-label="Welcome Overview">
        <div className="dash-hero-content">
          <div className="dash-hero-date">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{formattedDate}</span>
          </div>
          <h2 className="dash-hero-title">
            Welcome back, {user?.name?.split(" ")[0] || "Member"}
          </h2>
          <p className="dash-hero-subtitle">
            {stats.total === 0
              ? "Planova helps you organize smarter and achieve more. Start by creating your first task!"
              : stats.completed === stats.total
              ? "Incredible job! All tasks are completed. You're fully caught up!"
              : `You have completed ${stats.completed} of ${stats.total} tasks (${stats.percent}%). Organize smarter, achieve more.`}
          </p>
        </div>

        <div className="dash-hero-actions">
          <button type="button" className="btn-hero-add" onClick={onAddTask}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Task</span>
          </button>
          <button type="button" className="btn-hero-view" onClick={onViewAll}>
            <span>View Board</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ========================================================
          B. KPI STATISTICS CARDS
          ======================================================== */}
      <section className="dash-kpis" aria-label="Key Productivity Metrics">
        {/* Total Tasks */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-box kpi-icon-total">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <span className="kpi-tag kpi-tag-total">Planova</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-label">Total Tasks</span>
          </div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: "100%", background: "#4f46e5" }} />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-box kpi-icon-pending">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="kpi-tag kpi-tag-pending">Waiting</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{stats.pending}</span>
            <span className="kpi-label">Pending</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`,
                background: "#f59e0b",
              }}
            />
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-box kpi-icon-progress">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="kpi-tag kpi-tag-progress">Active</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{stats.inProgress}</span>
            <span className="kpi-label">In Progress</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`,
                background: "#10b981",
              }}
            />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-box kpi-icon-completed">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="kpi-tag kpi-tag-completed">{stats.percent}% Done</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{stats.completed}</span>
            <span className="kpi-label">Completed</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${stats.percent}%`,
                background: "#059669",
              }}
            />
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-box kpi-icon-overdue">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <span className="kpi-tag kpi-tag-overdue">{stats.overdue > 0 ? "Attention" : "On Track"}</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-value" style={{ color: stats.overdue > 0 ? "#ef4444" : "#0f172a" }}>
              {stats.overdue}
            </span>
            <span className="kpi-label">Overdue</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0}%`,
                background: "#ef4444",
              }}
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          C. ANALYTICS CHARTS SECTION
          ======================================================== */}
      <section className="dash-charts-grid" aria-label="Task Analytics">
        {/* Chart 1: Task Completion Ring */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title-group">
              <h3 className="chart-card-title">Completion Rate</h3>
              <span className="chart-card-subtitle">Real-time status breakdown</span>
            </div>
            <span className="badge badge-group">Planova</span>
          </div>

          <div className="doughnut-layout">
            <div className="doughnut-svg-wrapper">
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={circleRadius}
                  fill="transparent"
                  stroke="url(#planovaGradient)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 65 65)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
                <defs>
                  <linearGradient id="planovaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="doughnut-center-text">
                <span className="doughnut-center-number">{stats.percent}%</span>
                <span className="doughnut-center-label">Done</span>
              </div>
            </div>

            <div className="doughnut-legend">
              <div className="doughnut-legend-item">
                <div className="doughnut-legend-label">
                  <span className="legend-dot" style={{ background: "#10b981" }} />
                  <span>Completed</span>
                </div>
                <span className="doughnut-legend-count">{stats.completed}</span>
              </div>

              <div className="doughnut-legend-item">
                <div className="doughnut-legend-label">
                  <span className="legend-dot" style={{ background: "#059669" }} />
                  <span>In Progress</span>
                </div>
                <span className="doughnut-legend-count">{stats.inProgress}</span>
              </div>

              <div className="doughnut-legend-item">
                <div className="doughnut-legend-label">
                  <span className="legend-dot" style={{ background: "#f59e0b" }} />
                  <span>Pending</span>
                </div>
                <span className="doughnut-legend-count">{stats.pending}</span>
              </div>

              <div className="doughnut-legend-item">
                <div className="doughnut-legend-label">
                  <span className="legend-dot" style={{ background: "#ef4444" }} />
                  <span>Overdue</span>
                </div>
                <span className="doughnut-legend-count">{stats.overdue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Priority Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title-group">
              <h3 className="chart-card-title">Tasks by Priority</h3>
              <span className="chart-card-subtitle">Workload by urgency</span>
            </div>
            <button type="button" className="dash-panel-action" onClick={onViewAll}>
              Filter →
            </button>
          </div>

          <div className="priority-bars-layout">
            {/* High Priority */}
            <div className="priority-bar-item">
              <div className="priority-bar-header">
                <span className="priority-bar-label" style={{ color: "#ef4444" }}>
                  <span className="legend-dot" style={{ background: "#ef4444" }} />
                  High
                </span>
                <span className="priority-bar-stats">
                  {stats.highPriority} ({stats.total > 0 ? Math.round((stats.highPriority / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="priority-track">
                <div
                  className="priority-fill"
                  style={{
                    width: `${stats.total > 0 ? (stats.highPriority / stats.total) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #f87171 0%, #ef4444 100%)",
                  }}
                />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="priority-bar-item">
              <div className="priority-bar-header">
                <span className="priority-bar-label" style={{ color: "#d97706" }}>
                  <span className="legend-dot" style={{ background: "#f59e0b" }} />
                  Medium
                </span>
                <span className="priority-bar-stats">
                  {stats.medPriority} ({stats.total > 0 ? Math.round((stats.medPriority / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="priority-track">
                <div
                  className="priority-fill"
                  style={{
                    width: `${stats.total > 0 ? (stats.medPriority / stats.total) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                  }}
                />
              </div>
            </div>

            {/* Low Priority */}
            <div className="priority-bar-item">
              <div className="priority-bar-header">
                <span className="priority-bar-label" style={{ color: "#4f46e5" }}>
                  <span className="legend-dot" style={{ background: "#6366f1" }} />
                  Low
                </span>
                <span className="priority-bar-stats">
                  {stats.lowPriority} ({stats.total > 0 ? Math.round((stats.lowPriority / stats.total) * 100) : 0}%)
                </span>
              </div>
              <div className="priority-track">
                <div
                  className="priority-fill"
                  style={{
                    width: `${stats.total > 0 ? (stats.lowPriority / stats.total) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #818cf8 0%, #4f46e5 100%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Weekly Productivity Activity */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title-group">
              <h3 className="chart-card-title">Weekly Activity</h3>
              <span className="chart-card-subtitle">Tasks created or scheduled by date</span>
            </div>
            <span className="badge badge-group">Live Timeline</span>
          </div>

          <div className="weekly-chart-layout">
            {weeklyActivity.days.map((item) => {
              const heightPercent =
                weeklyActivity.maxCount > 0
                  ? Math.max(Math.round((item.count / weeklyActivity.maxCount) * 100), item.count > 0 ? 15 : 6)
                  : 6;

              return (
                <div key={item.date} className={`weekly-col ${item.isToday ? "is-today" : ""}`}>
                  {item.count > 0 && <span className="weekly-count-tag">{item.count}</span>}
                  <div className="weekly-bar-track">
                    <div
                      className="weekly-bar-fill"
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.day} (${item.date}): ${item.count} task(s) created or scheduled`}
                    />
                  </div>
                  <span className="weekly-day-label">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          D & E. DUAL PANELS: UPCOMING / TODAY'S & RECENT TASKS
          ======================================================== */}
      <section className="dash-bottom-grid" aria-label="Task Lists">
        {/* Panel 1: Upcoming / Due Soon Tasks */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">Upcoming &amp; Due Soon</h3>
            <button type="button" className="dash-panel-action" onClick={onViewAll}>
              View All Tasks →
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="dash-empty-state">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No upcoming due dates scheduled.</p>
            </div>
          ) : (
            <ul className="dash-task-list">
              {upcomingTasks.map((t) => {
                const isOverdue = t.due_date && new Date(t.due_date + "T23:59:59") < new Date();
                return (
                  <li key={t.id} className={`dash-task-card ${isOverdue ? "is-overdue" : ""}`}>
                    <div className="dash-task-main">
                      <button
                        type="button"
                        className="dash-task-check-btn"
                        title="Mark as Completed"
                        onClick={() => onStatusChange(t, "Completed")}
                      />
                      <div className="dash-task-info">
                        <span className="dash-task-title">{t.title}</span>
                        <div className="dash-task-meta">
                          <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                          <span style={{ fontWeight: 600 }}>{t.priority}</span>
                          <span className={`dash-task-date ${isOverdue ? "overdue" : ""}`}>
                            Due: {t.due_date} {isOverdue && "(Overdue)"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-task-right">
                      <button type="button" className="edit-btn" onClick={() => onEditTask(t)}>
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Panel 2: Recent Activity Tasks */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3 className="dash-panel-title">Recently Created &amp; Updated</h3>
            <button type="button" className="dash-panel-action" onClick={onViewCompleted}>
              View Completed ({stats.completed}) →
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="dash-empty-state">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p>No recent tasks. Click New Task to create one.</p>
            </div>
          ) : (
            <ul className="dash-task-list">
              {recentTasks.map((t) => {
                const isDone = t.status === "Completed";
                return (
                  <li key={t.id} className={`dash-task-card ${isDone ? "is-done" : ""}`}>
                    <div className="dash-task-main">
                      <button
                        type="button"
                        className={`dash-task-check-btn ${isDone ? "checked" : ""}`}
                        title={isDone ? "Mark as Pending" : "Mark as Completed"}
                        onClick={() => onStatusChange(t, isDone ? "Pending" : "Completed")}
                      >
                        {isDone && (
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" style={{ width: "12px", height: "12px" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      <div className="dash-task-info">
                        <span className="dash-task-title">{t.title}</span>
                        <div className="dash-task-meta">
                          <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                          <span style={{ fontWeight: 600 }}>{t.priority}</span>
                          <span>{t.due_date ? `Due: ${t.due_date}` : "No due date"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-task-right">
                      <button type="button" className="edit-btn" onClick={() => onEditTask(t)}>
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
