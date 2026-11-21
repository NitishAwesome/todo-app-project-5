import { useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

interface LayoutProps {
  children?: ReactNode;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onAddTask?: () => void;
  onNotificationClick?: (taskId?: number | null) => void;
  onNavigateHome?: () => void;
}

export default function Layout({
  children,
  activeTab = "tasks",
  onSelectTab,
  onAddTask,
  onNotificationClick,
  onNavigateHome,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "mobile-open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Body */}
      <div className="app-main-wrapper">
        <Navbar
          activeTab={activeTab}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onAddTask={onAddTask}
          onNotificationClick={onNotificationClick}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
