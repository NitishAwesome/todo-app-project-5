import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onNavigateHome?: () => void;
}

export default function Sidebar({
  activeTab = "tasks",
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
  onNavigateHome,
}: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const handleNavClick = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`} aria-label="Main Navigation">
      <div className="sidebar-top">
        {/* Brand / Logo */}
        <div className="sidebar-brand" onClick={onNavigateHome} style={{ cursor: "pointer" }} title="Go to Planova Home">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Planova</span>
            <span className="sidebar-brand-badge">{isAdmin ? "Admin Console" : "Smart Tasks"}</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          {/* Admin Section (Only rendered if user is Admin) */}
          {isAdmin && (
            <>
              <div className="sidebar-nav-heading">Administration</div>

              {/* Admin Dashboard */}
              <button
                type="button"
                className={`nav-link ${activeTab === "admin-dashboard" ? "active" : ""}`}
                onClick={() => handleNavClick("admin-dashboard")}
              >
                <div className="nav-link-content">
                  <span className="nav-link-icon" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-6.75-6.75l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                      />
                    </svg>
                  </span>
                  <span>Admin Dashboard</span>
                </div>
              </button>

              {/* User Management */}
              <button
                type="button"
                className={`nav-link ${activeTab === "admin-users" ? "active" : ""}`}
                onClick={() => handleNavClick("admin-users")}
              >
                <div className="nav-link-content">
                  <span className="nav-link-icon" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  </span>
                  <span>User Management</span>
                </div>
              </button>

              {/* System Tasks */}
              <button
                type="button"
                className={`nav-link ${activeTab === "admin-tasks" ? "active" : ""}`}
                onClick={() => handleNavClick("admin-tasks")}
              >
                <div className="nav-link-content">
                  <span className="nav-link-icon" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                      />
                    </svg>
                  </span>
                  <span>System Tasks</span>
                </div>
              </button>
            </>
          )}

          {/* Personal Workspace Section */}
          <div className="sidebar-nav-heading">
            {isAdmin ? "Personal Workspace" : "Workspace"}
          </div>

          {/* 1. Dashboard */}
          <button
            type="button"
            className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <div className="nav-link-content">
              <span className="nav-link-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              </span>
              <span>Dashboard</span>
            </div>
          </button>

          {/* 2. My Tasks */}
          <button
            type="button"
            className={`nav-link ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => handleNavClick("tasks")}
          >
            <div className="nav-link-content">
              <span className="nav-link-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </span>
              <span>My Tasks</span>
            </div>
          </button>

          {/* 3. Kanban Board */}
          <button
            type="button"
            className={`nav-link ${activeTab === "kanban" ? "active" : ""}`}
            onClick={() => handleNavClick("kanban")}
          >
            <div className="nav-link-content">
              <span className="nav-link-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 4.5v15m6-15v15m-10.5-15h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5z"
                  />
                </svg>
              </span>
              <span>Kanban Board</span>
            </div>
          </button>

          {/* 4. Calendar View */}
          <button
            type="button"
            className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => handleNavClick("calendar")}
          >
            <div className="nav-link-content">
              <span className="nav-link-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
              </span>
              <span>Calendar</span>
            </div>
          </button>

          {/* 5. Completed */}
          <button
            type="button"
            className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => handleNavClick("completed")}
          >
            <div className="nav-link-content">
              <span className="nav-link-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <span>Completed</span>
            </div>
          </button>

          {/* 6. Settings & Preferences (Step 7) */}
          <button
            type="button"
            className={`nav-link ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleNavClick("settings")}
          >
            <div className="nav-link-content">
              <span className="nav-link-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span>Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-team-card">
          <div className="sidebar-team-title">
            <span>Planova</span>
            <span className="badge-group">{isAdmin ? "Admin Console" : "Workspace"}</span>
          </div>
          <p className="sidebar-team-subtitle">
            Organize Smarter. Achieve More.
          </p>
          {onNavigateHome && (
            <button
              type="button"
              className="sidebar-home-link-btn"
              onClick={onNavigateHome}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "8px",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--primary)",
                cursor: "pointer",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                padding: "7px 10px",
                borderRadius: "var(--radius-sm)",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "15px", height: "15px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span>Public Homepage</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
