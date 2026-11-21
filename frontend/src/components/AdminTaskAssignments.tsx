import { useState, useEffect, useCallback } from "react";
import { teamApi } from "../teamAPI";
import { adminApi } from "../adminAPI";
import type { TeamTask, TeamAnalytics, TaskAssignment, AssignmentDiscussion } from "../types/team";
import type { AdminUserItem } from "../types/admin";
import "./AdminTaskAssignments.css";

export default function AdminTaskAssignments() {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // All available users for assignment
  const [availableUsers, setAvailableUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTaskId, setReminderTaskId] = useState<number | null>(null);
  const [reminderFilter, setReminderFilter] = useState<"incomplete" | "overdue" | "all">("incomplete");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderSending, setReminderSending] = useState(false);

  // Discussion state inside detail modal
  const [activeDiscussionAssignment, setActiveDiscussionAssignment] = useState<TaskAssignment | null>(null);
  const [discussions, setDiscussions] = useState<AssignmentDiscussion[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Edit Task State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TeamTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("");
  const [editAddAssigneeIds, setEditAddAssigneeIds] = useState<number[]>([]);
  const [editRemoveAssigneeIds, setEditRemoveAssigneeIds] = useState<number[]>([]);
  const [updatingTask, setUpdatingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [editError, setEditError] = useState("");

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([]);
  const [notifyImmediately, setNotifyImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Load Team Tasks and Analytics
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksData, analyticsData, usersResp] = await Promise.all([
        teamApi.getTeamTasks({
          search: search.trim() || undefined,
          priority: priorityFilter !== "All" ? priorityFilter : undefined,
        }),
        teamApi.getTeamAnalytics(),
        adminApi.getUsers({ page: 1, page_size: 100 }),
      ]);
      setTasks(tasksData);
      setAnalytics(analyticsData);
      setAvailableUsers(usersResp.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team tasks data.");
    } finally {
      setLoading(false);
    }
  }, [search, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load task details
  const handleOpenDetail = async (task: TeamTask) => {
    setSelectedTask(task);
    setActiveDiscussionAssignment(null);
    setShowDetailModal(true);
    try {
      const detail = await teamApi.getTeamTaskDetail(task.id);
      setSelectedTask(detail);
      if (detail.assignments && detail.assignments.length > 0) {
        setActiveDiscussionAssignment(detail.assignments[0]);
        loadDiscussions(detail.assignments[0].id);
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
    }
  };

  // Load discussion thread for selected assignment
  const loadDiscussions = async (assignmentId: number) => {
    try {
      const thread = await teamApi.getAssignmentDiscussions(assignmentId);
      setDiscussions(thread);
    } catch (err) {
      console.error("Failed to load discussions:", err);
    }
  };

  const handleSelectAssignment = (assignment: TaskAssignment) => {
    setActiveDiscussionAssignment(assignment);
    loadDiscussions(assignment.id);
  };

  const handleSendAdminReply = async () => {
    if (!activeDiscussionAssignment || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const newMsg = await teamApi.sendDiscussionMessage(activeDiscussionAssignment.id, {
        message: replyMessage.trim(),
        message_type: "comment",
      });
      setDiscussions((prev) => [...prev, newMsg]);
      setReplyMessage("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingReply(false);
    }
  };

  // Open Reminder Modal
  const handleOpenReminder = (task: TeamTask, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReminderTaskId(task.id);
    setReminderMessage(`Reminder: Please update your progress on "${task.title}". The deadline is approaching.`);
    setReminderFilter("incomplete");
    setShowReminderModal(true);
  };

  const handleSendReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTaskId || !reminderMessage.trim()) return;
    setReminderSending(true);
    try {
      const res = await teamApi.sendAdminReminder(reminderTaskId, {
        recipient_filter: reminderFilter,
        message: reminderMessage.trim(),
      });
      alert(`Reminder sent successfully! Notifications dispatched to ${res.sent_count} recipient(s).`);
      setShowReminderModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setReminderSending(false);
    }
  };

  // Open Edit Task Modal
  const handleOpenEditModal = (task: TeamTask, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditInstructions(task.instructions || "");
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ? String(task.due_date).slice(0, 10) : "");
    setEditDueTime(task.due_time ? String(task.due_time).slice(0, 5) : "");
    setEditAddAssigneeIds([]);
    setEditRemoveAssigneeIds([]);
    setEditError("");
    setShowEditModal(true);
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) {
      setEditError("Task title is required.");
      return;
    }

    setUpdatingTask(true);
    setEditError("");
    try {
      await teamApi.updateTeamTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        instructions: editInstructions.trim() || undefined,
        priority: editPriority,
        due_date: editDueDate || undefined,
        due_time: editDueTime ? `${editDueTime}:00` : undefined,
        add_assignee_ids: editAddAssigneeIds.length > 0 ? editAddAssigneeIds : undefined,
        remove_assignee_ids: editRemoveAssigneeIds.length > 0 ? editRemoveAssigneeIds : undefined,
      });

      setShowEditModal(false);
      setEditingTask(null);
      loadData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update team task.");
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleRevokeAssignment = async (assignmentId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to revoke and cancel this assignment for ${userName}?`)) {
      return;
    }
    try {
      await teamApi.revokeAssignment(assignmentId);
      if (selectedTask) {
        const detail = await teamApi.getTeamTaskDetail(selectedTask.id);
        setSelectedTask(detail);
      }
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke assignment");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this shared team task? All assignments and discussions for this task will be permanently removed.")) {
      return;
    }
    setDeletingTask(true);
    try {
      await teamApi.deleteTeamTask(taskId);
      setShowEditModal(false);
      setShowDetailModal(false);
      setEditingTask(null);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete team task");
    } finally {
      setDeletingTask(false);
    }
  };

  // Toggle user checkbox
  const toggleUserSelection = (userId: number) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    setSelectedAssigneeIds(availableUsers.map((u) => u.id));
  };

  const handleDeselectAllUsers = () => {
    setSelectedAssigneeIds([]);
  };

  // Submit Create Team Task
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }
    if (selectedAssigneeIds.length === 0) {
      setFormError("Please select at least one assignee for this team task.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await teamApi.createTeamTask({
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        due_time: dueTime ? `${dueTime}:00` : undefined,
        timezone,
        assignee_ids: selectedAssigneeIds,
        send_immediate_notification: notifyImmediately,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setInstructions("");
      setPriority("Medium");
      setDueDate("");
      setDueTime("");
      setSelectedAssigneeIds([]);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create team task.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered available users for picker
  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="admin-assignments-container">
      {/* Top Header */}
      <div className="admin-assignments-header">
        <div className="assignments-header-info">
          <h2>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "24px", height: "24px", color: "var(--primary, #6366f1)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Team Task Assignments
          </h2>
          <p>Assign tasks across team members with exact deadlines, track individual recipient progress, and exchange private updates.</p>
        </div>

        <div className="assignments-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {analytics && (
        <div className="assignments-metrics-grid">
          <div className="metric-card">
            <span className="metric-card-label">Shared Team Tasks</span>
            <span className="metric-card-value">{analytics.total_team_tasks}</span>
            <span className="metric-card-sub">Active organizational definitions</span>
          </div>
          <div className="metric-card">
            <span className="metric-card-label">Total Assignments</span>
            <span className="metric-card-value">{analytics.total_assignments}</span>
            <span className="metric-card-sub">{analytics.active_assignments} in active progress</span>
          </div>
          <div className="metric-card">
            <span className="metric-card-label">Overall Completion</span>
            <span className="metric-card-value" style={{ color: "#059669" }}>
              {analytics.overall_completion_rate.toFixed(1)}%
            </span>
            <span className="metric-card-sub">{analytics.completed_assignments} of {analytics.total_assignments} completed</span>
          </div>
          <div className="metric-card">
            <span className="metric-card-label">Overdue Assignments</span>
            <span className="metric-card-value" style={{ color: analytics.overdue_assignments > 0 ? "#dc2626" : "var(--text)" }}>
              {analytics.overdue_assignments}
            </span>
            <span className="metric-card-sub">Requiring manager attention</span>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="assignments-controls-bar">
        <div className="assignments-search-box">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="assignments-search-input"
            placeholder="Search team tasks by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="assignments-filters">
          <select
            className="assignments-filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            title="Refresh assignments"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ padding: "1rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Task List / Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          Loading team task assignments...
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)" }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "48px", height: "48px", color: "var(--muted)", margin: "0 auto 1rem" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem" }}>No team tasks found</h3>
          <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
            {search || priorityFilter !== "All"
              ? "No team tasks match your search filters."
              : "Create your first team task and assign it to team members to start tracking progress."}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Assign New Task
          </button>
        </div>
      ) : (
        <div className="team-tasks-grid">
          {tasks.map((task) => {
            const hasOverdue = task.overdue_count > 0;
            return (
              <div key={task.id} className="team-task-card" onClick={() => handleOpenDetail(task)} style={{ cursor: "pointer" }}>
                <div className="team-task-card-top">
                  <div>
                    <h4 className="team-task-card-title">{task.title}</h4>
                    {task.description && <p className="team-task-card-desc">{task.description}</p>}
                  </div>
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                </div>

                {/* Progress bar */}
                <div className="team-task-progress-section">
                  <div className="progress-header">
                    <span>Overall Progress</span>
                    <span style={{ fontWeight: 700 }}>{task.completion_rate.toFixed(0)}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${task.completion_rate}%` }} />
                  </div>
                </div>

                {/* Rollups bar */}
                <div className="task-rollups-bar">
                  <span className="rollup-pill completed">
                    ✓ {task.completed_count} Done
                  </span>
                  <span className="rollup-pill in-progress">
                    ⚡ {task.in_progress_count} In Progress
                  </span>
                  <span className="rollup-pill pending">
                    ⏳ {task.pending_count} Pending
                  </span>
                  {hasOverdue && (
                    <span className="rollup-pill overdue">
                      ⚠ {task.overdue_count} Overdue
                    </span>
                  )}
                </div>

                {/* Meta info & actions */}
                <div className="team-task-card-meta">
                  <div className={`team-task-due-info ${hasOverdue ? "overdue" : ""}`}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {task.due_date ? `${task.due_date}${task.due_time ? ` at ${String(task.due_time).slice(0, 5)}` : ""}` : "No deadline"}
                    </span>
                  </div>

                  <div className="team-task-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={(e) => handleOpenReminder(task, e)}
                      title="Send deadline reminder to assignees"
                    >
                      Remind
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={(e) => handleOpenEditModal(task, e)}
                      title="Edit task details or add assignees"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      onClick={() => handleOpenDetail(task)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1: ASSIGN NEW TEAM TASK ================= */}
      {showCreateModal && (
        <div className="planova-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="planova-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="planova-modal-header">
              <h3>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "22px", height: "22px", color: "var(--primary, #6366f1)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Assign Shared Team Task
              </h3>
              <button
                type="button"
                className="planova-modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="planova-modal-form">
              <div className="planova-modal-body">
                {formError && (
                  <div style={{ padding: "0.75rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.88rem" }}>
                    {formError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="form-group-label" htmlFor="task-title-input">
                    Task Title<span className="required">*</span>
                  </label>
                  <input
                    id="task-title-input"
                    type="text"
                    className="form-input-text"
                    placeholder="e.g. Prepare Quarterly System Security Audit"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="form-group-label" htmlFor="task-desc-input">
                    Description & Objectives
                  </label>
                  <textarea
                    id="task-desc-input"
                    className="form-textarea"
                    rows={2}
                    placeholder="Provide context and high-level requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="form-group-label" htmlFor="task-instructions-input">
                    Step-by-Step Instructions & Guidelines
                  </label>
                  <textarea
                    id="task-instructions-input"
                    className="form-textarea"
                    rows={2}
                    placeholder="Specific delivery checklist or steps to follow..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                {/* Priority, Due Date, Due Time */}
                <div className="form-row-3">
                  <div>
                    <label className="form-group-label" htmlFor="task-priority-select">Priority</label>
                    <select
                      id="task-priority-select"
                      className="form-input-text"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-group-label" htmlFor="task-due-date-input">Due Date</label>
                    <input
                      id="task-due-date-input"
                      type="date"
                      className="form-input-text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-group-label" htmlFor="task-due-time-input">Exact Due Time</label>
                    <input
                      id="task-due-time-input"
                      type="time"
                      className="form-input-text"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      title={`Timezone: ${timezone}`}
                    />
                  </div>
                </div>

                {/* Assignee Multi-Picker with Search & Chips */}
                <div>
                  <label className="form-group-label">
                    Assign Recipients<span className="required">*</span>
                    <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: "6px" }}>
                      ({selectedAssigneeIds.length} of {availableUsers.length} selected)
                    </span>
                  </label>

                  <div className="assignee-selector-box">
                    <div className="assignee-selector-top">
                      <input
                        type="text"
                        className="form-input-text"
                        style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", flex: 1 }}
                        placeholder="Search team members by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          onClick={handleSelectAllUsers}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          onClick={handleDeselectAllUsers}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Selected chips */}
                    {selectedAssigneeIds.length > 0 && (
                      <div className="selected-chips-bar">
                        {selectedAssigneeIds.map((id) => {
                          const user = availableUsers.find((u) => u.id === id);
                          if (!user) return null;
                          return (
                            <span key={id} className="user-chip">
                              {user.name}
                              <button
                                type="button"
                                className="user-chip-remove"
                                onClick={() => toggleUserSelection(id)}
                                title="Remove"
                              >
                                ✕
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* User picker list */}
                    <div className="user-picker-list">
                      {filteredUsers.length === 0 ? (
                        <div style={{ padding: "0.8rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                          No users match "{userSearch}"
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelected = selectedAssigneeIds.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className={`user-picker-item ${isSelected ? "selected" : ""}`}
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <div className="user-picker-info">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by parent div
                                  aria-label={`Select ${user.name}`}
                                />
                                <div className="user-picker-avatar">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="user-picker-name">{user.name}</div>
                                  <div className="user-picker-email">{user.email}</div>
                                </div>
                              </div>
                              <span className={`badge ${user.role === "Admin" ? "badge-high" : "badge-low"}`}>
                                {user.role}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Immediate notification checkbox */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                  <input
                    id="notify-immediately-check"
                    type="checkbox"
                    checked={notifyImmediately}
                    onChange={(e) => setNotifyImmediately(e.target.checked)}
                  />
                  <label htmlFor="notify-immediately-check" style={{ cursor: "pointer", color: "var(--text)" }}>
                    Send in-app notification toasts to all assigned users immediately
                  </label>
                </div>
              </div>

              <div className="planova-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Assigning Task..." : `Assign Task to ${selectedAssigneeIds.length} User(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: TASK DETAILS & RECIPIENT PROGRESS ================= */}
      {showDetailModal && selectedTask && (
        <div className="planova-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="planova-modal-box" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <div className="planova-modal-header">
              <div>
                <h3 style={{ margin: "0 0 4px" }}>{selectedTask.title}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  Created on {new Date(selectedTask.created_at).toLocaleDateString()} by {selectedTask.admin_name || "Admin"}
                </span>
              </div>
              <button
                type="button"
                className="planova-modal-close-btn"
                onClick={() => setShowDetailModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="planova-modal-body">
              {/* Task Overview Details */}
              {selectedTask.description && (
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 4px" }}>Description</h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text)", margin: 0 }}>{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.instructions && (
                <div style={{ padding: "0.85rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 4px", color: "var(--primary)" }}>
                    Instructions
                  </h4>
                  <p style={{ fontSize: "0.88rem", color: "var(--text)", margin: 0, whiteSpace: "pre-line" }}>
                    {selectedTask.instructions}
                  </p>
                </div>
              )}

              {/* Recipient Progress Breakdown Table */}
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 8px" }}>
                  Assigned Recipients ({selectedTask.assignments?.length || 0})
                </h4>
                <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <table className="recipient-detail-table">
                    <thead>
                      <tr>
                        <th>Recipient</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Notes & Blockers</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTask.assignments?.map((assignment) => {
                        const isSelected = activeDiscussionAssignment?.id === assignment.id;
                        return (
                          <tr
                            key={assignment.id}
                            style={{ background: isSelected ? "rgba(99, 102, 241, 0.05)" : undefined }}
                          >
                            <td>
                              <div style={{ fontWeight: 600 }}>{assignment.user_name || "User"}</div>
                              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{assignment.user_email}</div>
                            </td>
                            <td>
                              <span className={`rollup-pill ${assignment.status.toLowerCase().replace("inprogress", "in-progress")}`}>
                                {assignment.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "60px", height: "6px", background: "var(--border)", borderRadius: "999px" }}>
                                  <div
                                    style={{
                                      width: `${assignment.progress_percent}%`,
                                      height: "100%",
                                      background: "var(--primary)",
                                      borderRadius: "999px",
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                                  {assignment.progress_percent}%
                                </span>
                              </div>
                            </td>
                            <td>
                              {assignment.blockers ? (
                                <span style={{ color: "#dc2626", fontSize: "0.82rem", fontWeight: 600 }}>
                                  Blocker: {assignment.blockers}
                                </span>
                              ) : assignment.notes ? (
                                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                                  {assignment.notes}
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic" }}>
                                  No notes reported
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                                  style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                                  onClick={() => handleSelectAssignment(assignment)}
                                >
                                  Discussion
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "4px 8px", fontSize: "0.78rem", color: "#dc2626", borderColor: "rgba(239, 68, 68, 0.3)" }}
                                  onClick={() => handleRevokeAssignment(assignment.id, assignment.user_name || "User")}
                                  title="Revoke this user's assignment"
                                >
                                  Revoke
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discussion Thread Drawer with selected recipient */}
              {activeDiscussionAssignment && (
                <div className="discussion-container">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>
                      Private Thread with {activeDiscussionAssignment.user_name}
                    </h5>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      Status: {activeDiscussionAssignment.status} ({activeDiscussionAssignment.progress_percent}%)
                    </span>
                  </div>

                  <div className="discussion-messages-list">
                    {discussions.length === 0 ? (
                      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.82rem", padding: "1rem" }}>
                        No messages yet in this assignment thread.
                      </div>
                    ) : (
                      discussions.map((msg) => (
                        <div
                          key={msg.id}
                          className={`discussion-bubble ${msg.sender_role === "Admin" ? "from-admin" : "from-user"}`}
                        >
                          <div>{msg.message}</div>
                          <div className="discussion-meta">
                            <span>{msg.sender_name || msg.sender_role}</span>
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="discussion-input-box">
                    <input
                      type="text"
                      className="form-input-text"
                      placeholder="Type a reply or guidance to this team member..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendAdminReply()}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendAdminReply}
                      disabled={sendingReply || !replyMessage.trim()}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="planova-modal-footer" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: "#dc2626", borderColor: "rgba(239, 68, 68, 0.3)" }}
                onClick={() => handleDeleteTask(selectedTask.id)}
                disabled={deletingTask}
              >
                {deletingTask ? "Deleting..." : "Delete Task"}
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEditModal(selectedTask);
                  }}
                >
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SEND DEADLINE REMINDER ================= */}
      {showReminderModal && (
        <div className="planova-modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="planova-modal-box" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="planova-modal-header">
              <h3>Send Deadline Reminder</h3>
              <button
                type="button"
                className="planova-modal-close-btn"
                onClick={() => setShowReminderModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendReminderSubmit} className="planova-modal-form">
              <div className="planova-modal-body">
                <div>
                  <label className="form-group-label" htmlFor="reminder-filter-select">
                    Target Recipients
                  </label>
                  <select
                    id="reminder-filter-select"
                    className="form-input-text"
                    value={reminderFilter}
                    onChange={(e) => setReminderFilter(e.target.value as any)}
                  >
                    <option value="incomplete">Incomplete Assignees Only (Pending & InProgress)</option>
                    <option value="overdue">Overdue Assignees Only</option>
                    <option value="all">All Assignees</option>
                  </select>
                </div>

                <div>
                  <label className="form-group-label" htmlFor="reminder-msg-textarea">
                    Reminder Message
                  </label>
                  <textarea
                    id="reminder-msg-textarea"
                    className="form-textarea"
                    rows={3}
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="planova-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReminderModal(false)}
                  disabled={reminderSending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reminderSending || !reminderMessage.trim()}
                >
                  {reminderSending ? "Sending..." : "Dispatch Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: EDIT SHARED TEAM TASK ================= */}
      {showEditModal && editingTask && (
        <div className="planova-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="planova-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="planova-modal-header">
              <h3>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px", color: "var(--primary, #6366f1)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit Shared Team Task
              </h3>
              <button
                type="button"
                className="planova-modal-close-btn"
                onClick={() => setShowEditModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="planova-modal-form">
              <div className="planova-modal-body">
                {editError && (
                  <div style={{ padding: "0.75rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.88rem" }}>
                    {editError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="form-group-label" htmlFor="edit-task-title">
                    Task Title<span className="required">*</span>
                  </label>
                  <input
                    id="edit-task-title"
                    type="text"
                    className="form-input-text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="form-group-label" htmlFor="edit-task-desc">
                    Description & Objectives
                  </label>
                  <textarea
                    id="edit-task-desc"
                    className="form-textarea"
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="form-group-label" htmlFor="edit-task-instructions">
                    Instructions & Guidelines
                  </label>
                  <textarea
                    id="edit-task-instructions"
                    className="form-textarea"
                    rows={2}
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                  />
                </div>

                {/* Priority, Due Date, Due Time */}
                <div className="form-row-3">
                  <div>
                    <label className="form-group-label" htmlFor="edit-task-priority">Priority</label>
                    <select
                      id="edit-task-priority"
                      className="form-input-text"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as any)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-group-label" htmlFor="edit-task-due-date">Due Date</label>
                    <input
                      id="edit-task-due-date"
                      type="date"
                      className="form-input-text"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-group-label" htmlFor="edit-task-due-time">Due Time</label>
                    <input
                      id="edit-task-due-time"
                      type="time"
                      className="form-input-text"
                      value={editDueTime}
                      onChange={(e) => setEditDueTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Currently Assigned Members */}
                <div>
                  <label className="form-group-label">
                    Currently Assigned ({editingTask.assignments?.filter((a) => !editRemoveAssigneeIds.includes(a.user_id)).length || 0} members)
                  </label>
                  <div className="selected-chips-bar">
                    {editingTask.assignments?.map((a) => {
                      const isMarkedForRemoval = editRemoveAssigneeIds.includes(a.user_id);
                      return (
                        <span
                          key={a.id}
                          className="user-chip"
                          style={{
                            background: isMarkedForRemoval ? "#fef2f2" : "rgba(99, 102, 241, 0.08)",
                            borderColor: isMarkedForRemoval ? "#ef4444" : undefined,
                            color: isMarkedForRemoval ? "#dc2626" : undefined,
                            textDecoration: isMarkedForRemoval ? "line-through" : undefined,
                          }}
                        >
                          {a.user_name || a.user_email}
                          <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>({a.status})</span>
                          <button
                            type="button"
                            className="user-chip-remove"
                            style={{ color: isMarkedForRemoval ? "#dc2626" : "var(--muted)", marginLeft: "4px" }}
                            onClick={() => {
                              setEditRemoveAssigneeIds((prev) =>
                                prev.includes(a.user_id)
                                  ? prev.filter((id) => id !== a.user_id)
                                  : [...prev, a.user_id]
                              );
                            }}
                            title={isMarkedForRemoval ? "Undo remove" : "Remove recipient"}
                          >
                            {isMarkedForRemoval ? "↺" : "✕"}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Add More Assignees */}
                {(() => {
                  const alreadyAssignedUserIds = new Set(editingTask.assignments?.map((a) => a.user_id) || []);
                  const unassignedUsers = availableUsers.filter((u) => !alreadyAssignedUserIds.has(u.id));

                  if (unassignedUsers.length === 0) return null;

                  return (
                    <div>
                      <label className="form-group-label">
                        Add More Team Members ({editAddAssigneeIds.length} selected)
                      </label>
                      <div className="user-picker-list" style={{ maxHeight: "110px" }}>
                        {unassignedUsers.map((user) => {
                          const isSelected = editAddAssigneeIds.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className={`user-picker-item ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                setEditAddAssigneeIds((prev) =>
                                  prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                                );
                              }}
                            >
                              <div className="user-picker-info">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  aria-label={`Add ${user.name}`}
                                />
                                <div className="user-picker-avatar">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="user-picker-name">{user.name}</div>
                                  <div className="user-picker-email">{user.email}</div>
                                </div>
                              </div>
                              <span className={`badge ${user.role === "Admin" ? "badge-high" : "badge-low"}`}>
                                {user.role}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="planova-modal-footer" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: "#dc2626", borderColor: "rgba(239, 68, 68, 0.3)" }}
                  onClick={() => handleDeleteTask(editingTask.id)}
                  disabled={deletingTask || updatingTask}
                >
                  {deletingTask ? "Deleting..." : "Delete Task"}
                </button>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={updatingTask}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingTask}
                  >
                    {updatingTask ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
