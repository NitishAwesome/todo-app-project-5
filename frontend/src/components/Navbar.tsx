import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { preferenceApi } from "../productivityAPI";
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

  // Direct top-level theme toggle state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const docTheme = document.documentElement.getAttribute("data-theme");
    if (docTheme === "dark" || docTheme === "light") return docTheme;
    const stored = localStorage.getItem("planova_theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Keep state synchronized with any other theme switchers (SettingsView, etc.)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "dark" || current === "light") {
        setTheme(current);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("planova_theme", nextTheme);
    preferenceApi.update({ theme: nextTheme }).catch(() => {});
  };

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

        {/* Direct Theme Toggle Button (Top Navbar) */}
        <button
          type="button"
          className="navbar-btn-theme"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="theme-icon sun-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="theme-icon moon-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

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
