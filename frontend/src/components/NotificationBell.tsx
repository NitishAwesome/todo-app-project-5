import { useState, useEffect, useRef, useCallback } from "react";
import { notificationApi, reminderApi } from "../productivityAPI";
import type { Notification } from "../types/productivity";
import "./NotificationBell.css";

interface NotificationBellProps {
  onNotificationClick?: (task_id?: number | null) => void;
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications and unread count
  const fetchNotifications = useCallback(async () => {
    try {
      // First process any due reminders into notifications
      try {
        await reminderApi.processDue();
      } catch {
        // Non-blocking if reminder processing fails
      }

      const [items, count] = await Promise.all([
        notificationApi.getAll(),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
      setError("");
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  // Poll notifications periodically (every 45s) and on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Toggle dropdown
  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchNotifications();
      }
      return next;
    });
  };

  // Mark single as read
  const handleMarkRead = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return dateStr.slice(0, 10);
    }
  };

  return (
    <div className="planova-notif-container" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`notif-bell-btn ${open ? "active" : ""}`}
        onClick={handleToggle}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        title="View Notifications"
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {open && (
        <div className="notif-dropdown" role="region" aria-label="Notifications panel">
          <div className="notif-header">
            <div className="notif-header-title">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-all-btn"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                Mark all read
              </button>
            )}
          </div>

          {error && <div className="notif-error">{error}</div>}

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon" aria-hidden="true">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="notif-empty-text">No notifications</p>
                <span className="notif-empty-sub">You're completely caught up!</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${notif.is_read ? "is-read" : "is-unread"}`}
                  onClick={() => {
                    if (!notif.is_read) {
                      handleMarkRead(notif.id);
                    }
                    if (notif.task_id && onNotificationClick) {
                      onNotificationClick(notif.task_id);
                      setOpen(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="notif-item-icon" aria-hidden="true">
                    {notif.type === "reminder" ? (
                      <span className="notif-type-icon reminder" style={{ display: "inline-flex", alignItems: "center" }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px", color: "var(--primary, #6366f1)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    ) : notif.type === "due_soon" ? (
                      <span className="notif-type-icon due" style={{ display: "inline-flex", alignItems: "center" }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px", color: "#d97706" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </span>
                    ) : (
                      <span className="notif-type-icon general" style={{ display: "inline-flex", alignItems: "center" }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px", color: "#64748b" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                      </span>
                    )}
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <h4 className="notif-item-title">{notif.title}</h4>
                      <span className="notif-item-time">{formatTimeAgo(notif.created_at)}</span>
                    </div>
                    <p className="notif-item-msg">{notif.message}</p>
                  </div>

                  {!notif.is_read && (
                    <button
                      type="button"
                      className="notif-read-dot-btn"
                      title="Mark as read"
                      onClick={(e) => handleMarkRead(notif.id, e)}
                      aria-label="Mark as read"
                    >
                      <span className="notif-dot" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
