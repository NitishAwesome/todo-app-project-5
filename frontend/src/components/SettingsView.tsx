import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { preferenceApi } from "../productivityAPI";
import type { UserPreference } from "../types/productivity";
import "./SettingsView.css";

interface SettingsViewProps {
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export default function SettingsView({ onThemeChange }: SettingsViewProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [defaultView, setDefaultView] = useState<"dashboard" | "tasks" | "kanban" | "calendar">("dashboard");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [timezone, setTimezone] = useState("UTC");

  // Load user preferences from FastAPI backend
  useEffect(() => {
    let isMounted = true;
    async function loadPrefs() {
      try {
        setLoading(true);
        const data = await preferenceApi.get();
        if (isMounted) {
          setPreferences(data);
          setTheme(data.theme);
          setDefaultView(data.default_task_view);
          setNotificationsEnabled(data.notifications_enabled);
          setTimezone(data.timezone);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load preferences");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPrefs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    // Immediately apply theme to document
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    localStorage.setItem("planova_theme", newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      const updated = await preferenceApi.update({
        theme,
        default_task_view: defaultView,
        notifications_enabled: notificationsEnabled,
        timezone,
      });
      setPreferences(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="settings-spinner" />
        <p>Loading your Planova preferences...</p>
      </div>
    );
  }

  return (
    <div className="settings-view-container">
      {/* Header Banner */}
      <div className="settings-header">
        <div>
          <div className="settings-title-row">
            <h2>Settings &amp; Preferences</h2>
            <span className="badge badge-group">Preferences</span>
          </div>
          <p className="settings-subtitle">
            Customize your Planova experience, interface appearance, default workspace views, and alert settings.
          </p>
        </div>
      </div>

      {error && <div className="settings-alert-error">{error}</div>}
      {saveSuccess && (
        <div className="settings-alert-success">
          Preferences saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="settings-form">
        {/* Section 1: User Profile Card */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>User Account</h3>
            <p>Your authenticated identity and system role</p>
          </div>

          <div className="settings-profile-card">
            <div className="settings-profile-avatar">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "PL"}
            </div>
            <div className="settings-profile-details">
              <div className="settings-profile-name-row">
                <h4>{user?.name ?? "Planova Member"}</h4>
                <span className={`badge ${user?.role === "Admin" ? "badge-admin" : "badge-user"}`}>
                  {user?.role === "Admin" ? "Administrator" : "Standard Member"}
                </span>
              </div>
              <p className="settings-profile-email">{user?.email}</p>
              <span className="settings-profile-storage">
                Account active and verified.
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Appearance & Dark Mode */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>Appearance &amp; Theme</h3>
            <p>Choose between light, dark, or system-synchronized theme</p>
          </div>

          <div className="theme-options-grid">
            {/* Light Theme Card */}
            <div
              className={`theme-card ${theme === "light" ? "active" : ""}`}
              onClick={() => handleSelectTheme("light")}
              role="button"
              tabIndex={0}
            >
              <div className="theme-card-preview light-preview">
                <div className="preview-bar" />
                <div className="preview-box" />
              </div>
              <div className="theme-card-info">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px", color: "#f59e0b" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                <span className="theme-card-title">Light Mode</span>
              </div>
            </div>

            {/* Dark Theme Card */}
            <div
              className={`theme-card ${theme === "dark" ? "active" : ""}`}
              onClick={() => handleSelectTheme("dark")}
              role="button"
              tabIndex={0}
            >
              <div className="theme-card-preview dark-preview">
                <div className="preview-bar" />
                <div className="preview-box" />
              </div>
              <div className="theme-card-info">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px", color: "#818cf8" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                <span className="theme-card-title">Dark Mode</span>
              </div>
            </div>

            {/* System Sync Card */}
            <div
              className={`theme-card ${theme === "system" ? "active" : ""}`}
              onClick={() => handleSelectTheme("system")}
              role="button"
              tabIndex={0}
            >
              <div className="theme-card-preview system-preview">
                <div className="preview-bar" />
                <div className="preview-box" />
              </div>
              <div className="theme-card-info">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "18px", height: "18px", color: "#64748b" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
                <span className="theme-card-title">System Sync</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Default Workspace View */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>Default Startup View</h3>
            <p>Select which page opens automatically when you launch Planova</p>
          </div>

          <div className="settings-grid-options">
            <label className={`option-card ${defaultView === "dashboard" ? "selected" : ""}`}>
              <input
                type="radio"
                name="defaultView"
                value="dashboard"
                checked={defaultView === "dashboard"}
                onChange={() => setDefaultView("dashboard")}
              />
              <span className="option-title">Dashboard Overview</span>
              <span className="option-desc">Quick statistics, daily activity, and progress overview</span>
            </label>

            <label className={`option-card ${defaultView === "tasks" ? "selected" : ""}`}>
              <input
                type="radio"
                name="defaultView"
                value="tasks"
                checked={defaultView === "tasks"}
                onChange={() => setDefaultView("tasks")}
              />
              <span className="option-title">My Tasks (List View)</span>
              <span className="option-desc">Structured task list with comprehensive filters and actions</span>
            </label>

            <label className={`option-card ${defaultView === "kanban" ? "selected" : ""}`}>
              <input
                type="radio"
                name="defaultView"
                value="kanban"
                checked={defaultView === "kanban"}
                onChange={() => setDefaultView("kanban")}
              />
              <span className="option-title">Kanban Board</span>
              <span className="option-desc">Visual drag-and-drop status columns</span>
            </label>

            <label className={`option-card ${defaultView === "calendar" ? "selected" : ""}`}>
              <input
                type="radio"
                name="defaultView"
                value="calendar"
                checked={defaultView === "calendar"}
                onChange={() => setDefaultView("calendar")}
              />
              <span className="option-title">Calendar Schedule</span>
              <span className="option-desc">Monthly deadline schedule and date planner</span>
            </label>
          </div>
        </section>

        {/* Section 4: Notifications & Reminders */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>Reminders &amp; In-App Notifications</h3>
            <p>Control scheduled task reminders and real-time banner alerts</p>
          </div>

          <div className="settings-row-toggle">
            <div className="toggle-text">
              <span className="toggle-label">Enable In-App Notifications</span>
              <span className="toggle-sub">
                Receive visual reminders and alert badges when scheduled task deadlines arrive.
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span className="slider round" />
            </label>
          </div>

          <div className="settings-field-group">
            <label htmlFor="timezone-select" className="field-label">
              Preferred Timezone
            </label>
            <select
              id="timezone-select"
              className="settings-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <span className="field-hint">Used to calculate and format scheduled task reminder alerts.</span>
          </div>
        </section>

        {/* Save Actions */}
        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving Preferences..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
