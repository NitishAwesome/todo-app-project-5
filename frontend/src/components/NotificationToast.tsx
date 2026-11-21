import { useState, useEffect, useRef } from "react";
import { notificationApi } from "../productivityAPI";
import type { Notification } from "../types/productivity";
import "./NotificationToast.css";

interface NotificationToastProps {
  onNavigateToTask?: (taskId?: number | null, assignmentId?: number | null) => void;
}

export default function NotificationToast({ onNavigateToTask }: NotificationToastProps) {
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const isInitialMount = useRef(true);

  // Poll notifications
  useEffect(() => {
    let isSubscribed = true;

    const checkNewNotifications = async () => {
      try {
        const notifications = await notificationApi.getAll();
        if (!isSubscribed) return;

        // On first mount, mark all current notifications as already seen so we don't spam toasts
        if (isInitialMount.current) {
          notifications.forEach((n) => seenIdsRef.current.add(n.id));
          isInitialMount.current = false;
          return;
        }

        // Find genuinely new unread notifications
        const brandNew = notifications.filter(
          (n) => !n.is_read && !seenIdsRef.current.has(n.id)
        );

        if (brandNew.length > 0) {
          brandNew.forEach((n) => seenIdsRef.current.add(n.id));
          // Take up to 2 most recent new toasts
          setActiveToasts((prev) => [...prev, ...brandNew.slice(0, 2)]);
        }
      } catch {
        // Silently ignore network polling failures
      }
    };

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 6000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (activeToasts.length === 0) return;
    const timer = setTimeout(() => {
      setActiveToasts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToasts]);

  const handleDismiss = (id: number) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastAction = (notif: Notification) => {
    // Mark as read
    notificationApi.markRead(notif.id).catch(() => {});
    handleDismiss(notif.id);
    if (onNavigateToTask) {
      onNavigateToTask(notif.task_id, notif.assignment_id);
    }
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="planova-toast-container" aria-live="polite" aria-atomic="true">
      {activeToasts.map((toast) => (
        <div key={toast.id} className="planova-toast-item" role="alert">
          <div className="planova-toast-icon">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>

          <div className="planova-toast-content">
            <h5 className="planova-toast-title">
              {toast.title}
            </h5>
            <p className="planova-toast-msg">{toast.message}</p>

            <div className="planova-toast-actions">
              {(toast.assignment_id || toast.task_id) && (
                <button
                  type="button"
                  className="planova-toast-btn-action"
                  onClick={() => handleToastAction(toast)}
                >
                  View Details
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className="planova-toast-close"
            onClick={() => handleDismiss(toast.id)}
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
