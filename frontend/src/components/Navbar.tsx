import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  onToggleMobile?: () => void;
  onAddTask?: () => void;
  onNotificationClick?: (taskId?: number | null) => void;
  activeTab?: string;
}

export default function Navbar({
  onToggleMobile,
  onAddTask,
  onNotificationClick,
  activeTab = "tasks",
}: NavbarProps) {
  const { user, logout } = useAuth();

  const getTabLabel = () => {
    switch (activeTab) {
      case "admin-dashboard":
        return "Admin Dashboard";
      case "admin-users":
        return "User Management";
      case "admin-tasks":
        return "System Task Registry";
      case "dashboard":
        return "Dashboard Overview";
      case "kanban":
        return "Kanban Board";
      case "calendar":
        return "Calendar & Deadlines";
      case "completed":
        return "Completed Tasks";
      case "settings":
        return "Settings & Preferences";
      case "tasks":
      default:
        return "My Tasks";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="navbar" aria-label="Top Navigation">
      <div className="navbar-left">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={onToggleMobile}
          aria-label="Toggle navigation menu"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Breadcrumb / Title */}
        <div className="navbar-breadcrumb">
          <span className="navbar-breadcrumb-root">Planova</span>
          <span className="navbar-breadcrumb-separator">/</span>
          <h1 className="navbar-breadcrumb-active">{getTabLabel()}</h1>
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick Add Task Action Button */}
        {onAddTask && (
          <button type="button" className="navbar-btn-add" onClick={onAddTask}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Task</span>
          </button>
        )}

        {/* In-App Notifications Bell (Step 7) */}
        <NotificationBell onNotificationClick={onNotificationClick} />

        <div className="navbar-divider" aria-hidden="true" />

        {/* Real Authenticated User Profile */}
        <div className="navbar-user-profile" title={user ? `Signed in as ${user.email}` : "User Profile"}>
          <div className="navbar-avatar" aria-hidden="true">
            <span>{getInitials(user?.name)}</span>
            <span className="navbar-avatar-dot" />
          </div>
          <div className="navbar-user-meta">
            <span className="navbar-user-name">{user?.name ?? "Planova Member"}</span>
            <span className="navbar-user-role">
              {user?.role === "Admin" ? "Administrator" : "Member"} • Planova
            </span>
          </div>
        </div>

        {/* Logout Action Button */}
        <button
          type="button"
          className="navbar-btn-logout"
          onClick={logout}
          title="Sign out of Planova"
          aria-label="Sign out of your account"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
