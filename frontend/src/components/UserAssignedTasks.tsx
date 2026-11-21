import { useState, useEffect, useCallback } from "react";
import { teamApi } from "../teamAPI";
import type { TaskAssignment, AssignmentDiscussion } from "../types/team";
import "./UserAssignedTasks.css";

interface UserAssignedTasksProps {
  onTasksChanged?: () => void;
}

export default function UserAssignedTasks({ onTasksChanged }: UserAssignedTasksProps) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Update Progress Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [statusVal, setStatusVal] = useState<"Pending" | "InProgress" | "Completed">("Pending");
  const [progressVal, setProgressVal] = useState(0);
  const [notesVal, setNotesVal] = useState("");
  const [blockersVal, setBlockersVal] = useState("");
  const [updating, setUpdating] = useState(false);

  // Discussion Modal State
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussions, setDiscussions] = useState<AssignmentDiscussion[]>([]);
  const [newDiscussionMsg, setNewDiscussionMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Fetch my assigned tasks
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teamApi.getMyAssignedTasks({
        search: search.trim() || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        priority: priorityFilter !== "All" ? priorityFilter : undefined,
      });
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assigned tasks.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Open Progress Modal
  const handleOpenProgressModal = (item: TaskAssignment) => {
    setSelectedAssignment(item);
    setStatusVal(item.status);
    setProgressVal(item.progress_percent || 0);
    setNotesVal(item.notes || "");
    setBlockersVal(item.blockers || "");
    setShowProgressModal(true);
  };

  // Handle Progress change
  const handleProgressChange = (newPercent: number) => {
    setProgressVal(newPercent);
    if (newPercent === 100) {
      setStatusVal("Completed");
    } else if (newPercent > 0 && statusVal === "Pending") {
      setStatusVal("InProgress");
    }
  };

  // Submit Progress Update
  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setUpdating(true);
    try {
      const updated = await teamApi.updateAssignmentProgress(selectedAssignment.id, {
        status: statusVal,
        progress_percent: progressVal,
        notes: notesVal.trim() || undefined,
        blockers: blockersVal.trim() || undefined,
      });

      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setShowProgressModal(false);
      if (onTasksChanged) onTasksChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setUpdating(false);
    }
  };

  // Open Discussion Modal
  const handleOpenDiscussion = async (item: TaskAssignment) => {
    setSelectedAssignment(item);
    setShowDiscussionModal(true);
    try {
      const thread = await teamApi.getAssignmentDiscussions(item.id);
      setDiscussions(thread);
    } catch (err) {
      console.error("Failed to load discussions:", err);
    }
  };

  // Send Discussion Message
  const handleSendMessage = async () => {
    if (!selectedAssignment || !newDiscussionMsg.trim()) return;
    setSendingMsg(true);
    try {
      const msg = await teamApi.sendDiscussionMessage(selectedAssignment.id, {
        message: newDiscussionMsg.trim(),
        message_type: "inquiry",
      });
      setDiscussions((prev) => [...prev, msg]);
      setNewDiscussionMsg("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="assigned-tasks-container">
      {/* Header */}
      <div className="assigned-tasks-header">
        <div className="assigned-header-info">
          <h2>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "24px", height: "24px", color: "var(--primary, #6366f1)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Assigned to Me
          </h2>
          <p>Tasks assigned to you by administrators. Update your completion percentage, report blockers, and collaborate.</p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadAssignments}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="assigned-controls-bar">
        <div className="assigned-search-box">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="assigned-search-input"
            placeholder="Search assigned tasks by title or instructions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="assigned-filters-group">
          <select
            className="assignments-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="assignments-filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: "1rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          Loading your assigned tasks...
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)" }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: "48px", height: "48px", color: "var(--muted)", margin: "0 auto 1rem" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem" }}>No assigned tasks</h3>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {search || statusFilter !== "All" || priorityFilter !== "All"
              ? "No assigned tasks match your filter criteria."
              : "You have no team tasks assigned to you right now. Great job staying on top of your work!"}
          </p>
        </div>
      ) : (
        <div className="assigned-cards-grid">
          {assignments.map((item) => {
            const isCompleted = item.status === "Completed";
            const isInProgress = item.status === "InProgress";
            const cardClass = isCompleted ? "is-completed" : isInProgress ? "is-inprogress" : "is-pending";

            // Due Date & Time display
            const dueDisplay = item.task_due_date
              ? `${item.task_due_date}${item.task_due_time ? ` at ${String(item.task_due_time).slice(0, 5)}` : ""}`
              : "No deadline";

            return (
              <div key={item.id} className={`assigned-card ${cardClass}`}>
                <div className="assigned-card-top">
                  <div>
                    <h4 className="assigned-card-title">{item.task_title}</h4>
                    <div className="assigned-admin-info">
                      <span>Assigned by {item.admin_name || "Administrator"}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${(item.task_priority || "Medium").toLowerCase()}`}>
                    {item.task_priority || "Medium"}
                  </span>
                </div>

                {item.task_description && (
                  <p className="assigned-card-desc">{item.task_description}</p>
                )}

                {item.task_instructions && (
                  <div style={{ fontSize: "0.82rem", background: "var(--bg)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>Instructions: </span>
                    <span>{item.task_instructions}</span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="assigned-card-progress">
                  <div className="assigned-progress-label">
                    <span>Progress: {item.status}</span>
                    <span style={{ fontWeight: 700 }}>{item.progress_percent}%</span>
                  </div>
                  <div className="assigned-progress-track">
                    <div className="assigned-progress-fill" style={{ width: `${item.progress_percent}%` }} />
                  </div>
                </div>

                {/* Notes or Blockers */}
                {(item.notes || item.blockers) && (
                  <div className="assigned-card-notes-preview">
                    {item.blockers && (
                      <div style={{ color: "#dc2626", fontWeight: 600, marginBottom: "3px" }}>
                        ⚠ Blocker: {item.blockers}
                      </div>
                    )}
                    {item.notes && (
                      <div style={{ color: "var(--muted)" }}>
                        Latest note: {item.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer with deadline and action buttons */}
                <div className="assigned-card-footer">
                  <div className="assigned-deadline-info">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{dueDisplay}</span>
                  </div>

                  <div className="assigned-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "5px 10px", fontSize: "0.82rem" }}
                      onClick={() => handleOpenDiscussion(item)}
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "5px 12px", fontSize: "0.82rem" }}
                      onClick={() => handleOpenProgressModal(item)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1: UPDATE PROGRESS ================= */}
      {showProgressModal && selectedAssignment && (
        <div className="planova-modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="planova-modal-box" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="planova-modal-header">
              <h3>Update Task Progress</h3>
              <button
                type="button"
                className="planova-modal-close-btn"
                onClick={() => setShowProgressModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="planova-modal-form">
              <div className="planova-modal-body">
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 700 }}>
                    {selectedAssignment.task_title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                    Assigned by {selectedAssignment.admin_name || "Admin"}
                  </p>
                </div>

                {/* Status select */}
                <div>
                  <label className="form-group-label" htmlFor="progress-status-select">Status</label>
                  <select
                    id="progress-status-select"
                    className="form-input-text"
                    value={statusVal}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setStatusVal(newStatus);
                      if (newStatus === "Completed" && progressVal < 100) {
                        setProgressVal(100);
                      }
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Progress slider & percentage */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <label className="form-group-label" htmlFor="progress-slider">Completion Percentage</label>
                    <span style={{ fontWeight: 800, color: "var(--primary)" }}>{progressVal}%</span>
                  </div>
                  <input
                    id="progress-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--primary)" }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="form-group-label" htmlFor="progress-notes-input">
                    Accomplishments / Progress Notes
                  </label>
                  <textarea
                    id="progress-notes-input"
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Completed initial draft, waiting on API responses..."
                    value={notesVal}
                    onChange={(e) => setNotesVal(e.target.value)}
                  />
                </div>

                {/* Blockers */}
                <div>
                  <label className="form-group-label" htmlFor="progress-blockers-input" style={{ color: blockersVal ? "#dc2626" : "inherit" }}>
                    Blockers / Roadblocks (Optional)
                  </label>
                  <input
                    id="progress-blockers-input"
                    type="text"
                    className="form-input-text"
                    placeholder="e.g. Need VPN credentials to access staging environment"
                    value={blockersVal}
                    onChange={(e) => setBlockersVal(e.target.value)}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "2px", display: "block" }}>
                    Reporting a blocker will notify your administrator.
                  </span>
                </div>
              </div>

              <div className="planova-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProgressModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: DISCUSSION / INQUIRY ================= */}
      {showDiscussionModal && selectedAssignment && (
        <div className="planova-modal-overlay" onClick={() => setShowDiscussionModal(false)}>
          <div className="planova-modal-box" style={{ maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
            <div className="planova-modal-header">
              <div>
                <h3 style={{ margin: "0 0 2px" }}>Discussion with Manager</h3>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                  {selectedAssignment.task_title}
                </span>
              </div>
              <button
                type="button"
                className="planova-modal-close-btn"
                onClick={() => setShowDiscussionModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="planova-modal-body">
              <div className="discussion-messages-list" style={{ minHeight: "180px", maxHeight: "300px" }}>
                {discussions.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", padding: "2rem" }}>
                    No messages in this assignment thread yet. Send a question or update to your administrator below.
                  </div>
                ) : (
                  discussions.map((msg) => (
                    <div
                      key={msg.id}
                      className={`discussion-bubble ${msg.sender_role === "Admin" ? "from-admin" : "from-user"}`}
                    >
                      <div>{msg.message}</div>
                      <div className="discussion-meta">
                        <span>{msg.sender_name || (msg.sender_role === "Admin" ? "Administrator" : "You")}</span>
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
                  placeholder="Ask a question or send an update to manager..."
                  value={newDiscussionMsg}
                  onChange={(e) => setNewDiscussionMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={sendingMsg || !newDiscussionMsg.trim()}
                >
                  Send
                </button>
              </div>
            </div>

            <div className="planova-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDiscussionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
