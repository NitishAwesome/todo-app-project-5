import { useState } from "react";
import "./LandingPage.css";

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateApp: () => void;
  isAuthenticated: boolean;
  userRole?: string;
}

export default function LandingPage({
  onNavigateLogin,
  onNavigateRegister,
  onNavigateApp,
  isAuthenticated,
  userRole,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<
    "dashboard" | "tasks" | "kanban" | "calendar"
  >("dashboard");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [modalContent, setModalContent] = useState<"about" | "privacy" | null>(null);

  // Quick theme toggle from landing page
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("planova_theme", next);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCtaClick = () => {
    if (isAuthenticated) {
      onNavigateApp();
    } else {
      onNavigateRegister();
    }
  };

  return (
    <div className="planova-landing">
      {/* ========================================================
          1. NAVIGATION BAR
          ======================================================== */}
      <header className="landing-nav" aria-label="Main Navigation">
        <div className="landing-nav-inner">
          {/* Logo */}
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="landing-logo-icon" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.4" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="landing-brand-text">
              <span className="landing-brand-name">Planova</span>
              <span className="landing-brand-tag">Workspace</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="landing-nav-links" aria-label="Section Navigation">
            <button type="button" className="nav-text-link" onClick={() => scrollToSection("features")}>
              Features
            </button>
            <button type="button" className="nav-text-link" onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>
            <button type="button" className="nav-text-link" onClick={() => scrollToSection("preview")}>
              Showcase
            </button>
            <button type="button" className="nav-text-link" onClick={() => scrollToSection("faq")}>
              FAQ
            </button>
          </nav>

          {/* Nav Actions */}
          <div className="landing-nav-actions">
            {/* Theme Toggle Button with SVG Icons */}
            <button
              type="button"
              className="theme-switch-btn"
              onClick={toggleTheme}
              title="Toggle Light / Dark Mode"
              aria-label="Toggle Light / Dark Mode"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="theme-svg-icon light-icon" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="theme-svg-icon dark-icon" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </button>

            {isAuthenticated ? (
              <button type="button" className="btn btn-primary nav-app-btn" onClick={onNavigateApp}>
                <span>{userRole === "Admin" ? "Open Admin Console" : "Open Workspace"}</span>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="btn-arrow">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : (
              <>
                <button type="button" className="nav-signin-btn" onClick={onNavigateLogin}>
                  Sign In
                </button>
                <button type="button" className="btn btn-primary nav-getstarted-btn" onClick={onNavigateRegister}>
                  Get Started
                </button>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" role="menu">
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection("features")}>
              Features
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection("preview")}>
              Showcase
            </button>
            <button type="button" className="mobile-nav-link" onClick={() => scrollToSection("faq")}>
              FAQ
            </button>
            <div className="mobile-nav-divider" />
            {isAuthenticated ? (
              <button type="button" className="btn btn-primary mobile-cta-btn" onClick={onNavigateApp}>
                Open Workspace
              </button>
            ) : (
              <div className="mobile-auth-actions">
                <button type="button" className="btn btn-secondary" onClick={onNavigateLogin}>
                  Sign In
                </button>
                <button type="button" className="btn btn-primary" onClick={onNavigateRegister}>
                  Get Started Free
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ========================================================
          2. HERO SECTION
          ======================================================== */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-glow-blob" aria-hidden="true" />
        <div className="hero-container">
          <div className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            <span>Smart Task Management</span>
          </div>

          <h1 id="hero-heading" className="hero-title">
            Make room for <br />
            <span className="hero-title-highlight">what matters.</span>
          </h1>

          <p className="hero-subtitle">
            Organize your tasks, plan your days, and stay focused on your goals.
          </p>

          <div className="hero-cta-group">
            <button type="button" className="btn btn-hero-primary" onClick={handleCtaClick}>
              <span>{isAuthenticated ? "Go to Workspace" : "Get Started"}</span>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              type="button"
              className="btn btn-hero-secondary"
              onClick={() => scrollToSection("features")}
            >
              <span>Explore Features</span>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* User Benefits Strip with Vector Icons */}
          <div className="hero-highlights">
            <div className="highlight-item">
              <span className="highlight-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="benefit-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>Stay Organized</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="benefit-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </span>
              <span>Plan Your Day</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="benefit-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </span>
              <span>Track Progress</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="benefit-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </span>
              <span>All in One Place</span>
            </div>
          </div>

          {/* Clean Conceptual UI Preview */}
          <div className="hero-preview-window">
            <div className="preview-window-bar">
              <div className="preview-window-dots" aria-hidden="true">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="preview-window-address">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lock-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span>Planova Workspace</span>
              </div>
              <div className="preview-window-badge">Workspace Preview — Sample Data</div>
            </div>

            <div className="preview-window-content">
              {/* Clean App Mockup Header */}
              <div className="mockup-header">
                <div>
                  <h3 className="mockup-title">Daily Workspace</h3>
                  <p className="mockup-sub">Plan, organize, and accomplish tasks with clarity.</p>
                </div>
              </div>

              {/* Clean Stats Grid for Demonstration Tasks */}
              <div className="mockup-stats-grid">
                <div className="mockup-stat-card">
                  <span className="m-stat-label">Total Tasks</span>
                  <span className="m-stat-num">4</span>
                </div>
                <div className="mockup-stat-card">
                  <span className="m-stat-label">Pending</span>
                  <span className="m-stat-num">1</span>
                </div>
                <div className="mockup-stat-card">
                  <span className="m-stat-label">In Progress</span>
                  <span className="m-stat-num">2</span>
                </div>
                <div className="mockup-stat-card">
                  <span className="m-stat-label">Completed</span>
                  <span className="m-stat-num">1</span>
                </div>
              </div>

              {/* Simple Everyday Sample Tasks */}
              <div className="mockup-tasks-preview">
                <div className="m-task-item">
                  <div className="m-task-check checked">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="check-svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="m-task-info">
                    <span className="m-task-name">Review weekly goals</span>
                    <div className="m-task-tags">
                      <span className="m-tag m-tag-urgent">Planning</span>
                      <span className="m-subtask-prog">Completed today</span>
                    </div>
                  </div>
                  <span className="m-badge m-badge-done">Completed</span>
                </div>

                <div className="m-task-item">
                  <div className="m-task-check" />
                  <div className="m-task-info">
                    <span className="m-task-name">Prepare presentation</span>
                    <div className="m-task-tags">
                      <span className="m-tag m-tag-backend">Work</span>
                      <span className="m-subtask-prog">Due at 4:00 PM</span>
                    </div>
                  </div>
                  <span className="m-badge m-badge-inprogress">In Progress</span>
                </div>

                <div className="m-task-item">
                  <div className="m-task-check" />
                  <div className="m-task-info">
                    <span className="m-task-name">Read a chapter</span>
                    <div className="m-task-tags">
                      <span className="m-tag m-tag-frontend">Personal</span>
                      <span className="m-subtask-prog">30 minutes</span>
                    </div>
                  </div>
                  <span className="m-badge m-badge-inprogress">In Progress</span>
                </div>

                <div className="m-task-item">
                  <div className="m-task-check" />
                  <div className="m-task-info">
                    <span className="m-task-name">Plan tomorrow</span>
                    <div className="m-task-tags">
                      <span className="m-tag m-tag-backend">Routine</span>
                      <span className="m-subtask-prog">Evening checklist</span>
                    </div>
                  </div>
                  <span className="m-badge m-badge-pending">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. FEATURES SHOWCASE
          ======================================================== */}
      <section id="features" className="landing-section" aria-labelledby="features-heading">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Core Capabilities</span>
            <h2 id="features-heading" className="section-title">
              Designed for effortless organization.
            </h2>
            <p className="section-description">
              Every feature in Planova is crafted to eliminate friction and help you maintain momentum on your daily goals.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-purple">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Smart Task Management</h3>
              <p className="feature-desc">
                Organize tasks with full lifecycle tracking, instant title and description search, category filters, and quick status controls.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-blue">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-15h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5z" />
                </svg>
              </div>
              <h3 className="feature-title">Visual Kanban Board</h3>
              <p className="feature-desc">
                Transition tasks smoothly across Pending, In Progress, and Completed columns with keyboard-friendly controls and clear touch targets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-amber">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="feature-title">Calendar &amp; Deadlines</h3>
              <p className="feature-desc">
                Never miss milestones. The visual monthly schedule highlights overdue items, deadlines due today, and upcoming commitments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-green">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </div>
              <h3 className="feature-title">Productivity Analytics</h3>
              <p className="feature-desc">
                Gain actionable insights into your completion velocity, status ratios, and workload distributions computed directly from your tasks.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-pink">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <h3 className="feature-title">Subtasks &amp; Custom Tags</h3>
              <p className="feature-desc">
                Break complex goals into structured checklists with progress indicators and organize items with customizable color-coded tags.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-cyan">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="feature-title">Reminders &amp; Alerts</h3>
              <p className="feature-desc">
                Schedule in-app reminders for critical deadlines. The top navigation bell displays unread count badges and timely alert notifications.
              </p>
            </div>

            {/* Feature 7: Enterprise Collaboration */}
            <div className="feature-card">
              <div className="feature-icon-wrap icon-purple">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Team Collaboration &amp; Assignments</h3>
              <p className="feature-desc">
                Assign tasks across team members with exact deadlines, track individual recipient progress percentages, report blockers, and exchange private updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. HOW IT WORKS
          ======================================================== */}
      <section id="how-it-works" className="landing-section bg-subtle" aria-labelledby="steps-heading">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Simple Workflow</span>
            <h2 id="steps-heading" className="section-title">
              Three steps to peak productivity.
            </h2>
            <p className="section-description">
              Getting organized shouldn&apos;t feel complicated. Planova makes your daily routine smooth and focused.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Create Your Account</h3>
              <p className="step-desc">
                Sign up in seconds. Your private workspace is created immediately, protected with industry-standard encryption.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Organize Your Tasks</h3>
              <p className="step-desc">
                Add priorities, due dates, categories, and tags. Break complex goals into bite-sized subtasks with progress tracking.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Track &amp; Accomplish</h3>
              <p className="step-desc">
                Monitor your completion velocity on your dashboard, visualize deadlines on the calendar, and achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. PRODUCT SHOWCASE (Interactive Tab Preview)
          ======================================================== */}
      <section id="preview" className="landing-section" aria-labelledby="showcase-heading">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Interactive Showcase</span>
            <h2 id="showcase-heading" className="section-title">
              Designed for clarity and focus.
            </h2>
            <p className="section-description">
              Explore the four core workspaces that power Planova. Select each view below to preview the interface.
            </p>
          </div>

          {/* Tab Selector with Clean SVG Icons */}
          <div className="showcase-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activePreviewTab === "dashboard"}
              className={`showcase-tab ${activePreviewTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActivePreviewTab("dashboard")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="tab-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePreviewTab === "tasks"}
              className={`showcase-tab ${activePreviewTab === "tasks" ? "active" : ""}`}
              onClick={() => setActivePreviewTab("tasks")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="tab-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span>Task List</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePreviewTab === "kanban"}
              className={`showcase-tab ${activePreviewTab === "kanban" ? "active" : ""}`}
              onClick={() => setActivePreviewTab("kanban")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="tab-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-15h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5z" />
              </svg>
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePreviewTab === "calendar"}
              className={`showcase-tab ${activePreviewTab === "calendar" ? "active" : ""}`}
              onClick={() => setActivePreviewTab("calendar")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="tab-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Calendar</span>
            </button>
          </div>

          {/* Interactive Showcase Frame */}
          <div className="showcase-display-card">
            {activePreviewTab === "dashboard" && (
              <div className="showcase-panel">
                <div className="panel-headline">
                  <h4>Productivity Overview &amp; Task Velocity</h4>
                  <span className="badge badge-group">Analytics View</span>
                </div>
                <div className="showcase-grid-preview">
                  <div className="mockup-chart-card">
                    <span className="card-mini-title">Weekly Activity</span>
                    <div className="mockup-bars">
                      <div className="bar-col"><div className="bar-fill" style={{ height: "60%" }} /><span>Mon</span></div>
                      <div className="bar-col"><div className="bar-fill" style={{ height: "85%" }} /><span>Tue</span></div>
                      <div className="bar-col"><div className="bar-fill" style={{ height: "45%" }} /><span>Wed</span></div>
                      <div className="bar-col"><div className="bar-fill highlight" style={{ height: "95%" }} /><span>Thu</span></div>
                      <div className="bar-col"><div className="bar-fill" style={{ height: "70%" }} /><span>Fri</span></div>
                    </div>
                  </div>
                  <div className="mockup-tasks-col">
                    <span className="card-mini-title">Recent Accomplishments</span>
                    <div className="mini-task-row">
                      <span className="mini-check">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="check-svg-sm">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      <span className="mini-text">Review weekly goals</span>
                      <span className="m-badge m-badge-done">Done</span>
                    </div>
                    <div className="mini-task-row">
                      <span className="mini-dot" />
                      <span className="mini-text">Prepare presentation</span>
                      <span className="m-badge m-badge-inprogress">In Progress</span>
                    </div>
                    <div className="mini-task-row">
                      <span className="mini-dot" />
                      <span className="mini-text">Read a chapter</span>
                      <span className="m-badge m-badge-inprogress">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "tasks" && (
              <div className="showcase-panel">
                <div className="panel-headline">
                  <h4>Search, Filters, Tags &amp; Subtasks</h4>
                  <span className="badge badge-group">Task Workspace</span>
                </div>
                <div className="showcase-tasklist-preview">
                  <div className="showcase-sample-card">
                    <div className="sample-card-top">
                      <span className="sample-card-title">Prepare presentation</span>
                      <div className="sample-tags">
                        <span className="sample-tag tag-backend">Work</span>
                        <span className="m-badge m-priority-high">High</span>
                      </div>
                    </div>
                    <p className="sample-card-desc">Outline key milestones, project deliverables, and next steps.</p>
                    <div className="sample-card-bottom">
                      <span className="sample-progress-pill">2 of 4 subtasks</span>
                      <span className="sample-due-pill">Due Today</span>
                    </div>
                  </div>

                  <div className="showcase-sample-card">
                    <div className="sample-card-top">
                      <span className="sample-card-title">Review weekly goals</span>
                      <div className="sample-tags">
                        <span className="sample-tag tag-urgent">Planning</span>
                        <span className="m-badge m-priority-med">Medium</span>
                      </div>
                    </div>
                    <p className="sample-card-desc">Check completion progress across all weekly initiatives.</p>
                    <div className="sample-card-bottom">
                      <span className="sample-progress-pill">3 of 3 subtasks completed (100%)</span>
                      <span className="sample-due-pill">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "kanban" && (
              <div className="showcase-panel">
                <div className="panel-headline">
                  <h4>Visual Kanban Workflow Columns</h4>
                  <span className="badge badge-group">Three-State Board</span>
                </div>
                <div className="showcase-kanban-cols">
                  <div className="kanban-col-preview">
                    <div className="col-header-preview">
                      <span>Pending</span>
                      <span className="col-count-pill">1</span>
                    </div>
                    <div className="kanban-card-preview">
                      <span>Plan tomorrow</span>
                      <span className="sample-tag tag-backend">Routine</span>
                    </div>
                  </div>

                  <div className="kanban-col-preview highlight-col">
                    <div className="col-header-preview">
                      <span>In Progress</span>
                      <span className="col-count-pill">2</span>
                    </div>
                    <div className="kanban-card-preview">
                      <span>Prepare presentation</span>
                      <span className="sample-tag tag-frontend">Work</span>
                    </div>
                    <div className="kanban-card-preview" style={{ marginTop: "8px" }}>
                      <span>Read a chapter</span>
                      <span className="sample-tag tag-frontend">Personal</span>
                    </div>
                  </div>

                  <div className="kanban-col-preview">
                    <div className="col-header-preview">
                      <span>Completed</span>
                      <span className="col-count-pill">1</span>
                    </div>
                    <div className="kanban-card-preview done-card">
                      <span>Review weekly goals</span>
                      <span className="sample-tag tag-done">Planning</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "calendar" && (
              <div className="showcase-panel">
                <div className="panel-headline">
                  <h4>Monthly Schedule &amp; Deadline Calendar</h4>
                  <span className="badge badge-group">Calendar Matrix</span>
                </div>
                <div className="showcase-calendar-grid">
                  <div className="cal-day-header">Mon</div>
                  <div className="cal-day-header">Tue</div>
                  <div className="cal-day-header">Wed</div>
                  <div className="cal-day-header">Thu</div>
                  <div className="cal-day-header">Fri</div>
                  <div className="cal-day-header">Sat</div>
                  <div className="cal-day-header">Sun</div>

                  <div className="cal-cell muted">26</div>
                  <div className="cal-cell muted">27</div>
                  <div className="cal-cell muted">28</div>
                  <div className="cal-cell">1</div>
                  <div className="cal-cell has-deadline">
                    <span className="cal-num">2</span>
                    <span className="cal-task-pill">Goals Review</span>
                  </div>
                  <div className="cal-cell">3</div>
                  <div className="cal-cell">4</div>

                  <div className="cal-cell">5</div>
                  <div className="cal-cell">6</div>
                  <div className="cal-cell has-deadline highlight-cell">
                    <span className="cal-num">7</span>
                    <span className="cal-task-pill">Presentation</span>
                  </div>
                  <div className="cal-cell">8</div>
                  <div className="cal-cell">9</div>
                  <div className="cal-cell">10</div>
                  <div className="cal-cell">11</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FREQUENTLY ASKED QUESTIONS
          ======================================================== */}
      <section id="faq" className="landing-section bg-subtle" aria-labelledby="faq-heading">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-eyebrow">Clear Answers</span>
            <h2 id="faq-heading" className="section-title">
              Frequently Asked Questions
            </h2>
            <p className="section-description">
              Everything you need to know about how Planova works and how your workspace is kept organized.
            </p>
          </div>

          <div className="faq-accordion-list">
            {[
              {
                q: "How do I create an account and get started?",
                a: "Click 'Get Started' at the top of the page, provide your name, email, and password. Your personal workspace is provisioned immediately with your tasks ready to organize.",
              },
              {
                q: "How is my task data saved and persisted?",
                a: "Every task, checklist subtask, custom tag, and reminder is saved to a persistent database. Your changes are committed instantly and restored seamlessly whenever you log back in.",
              },
              {
                q: "Does Planova work on mobile phones and tablets?",
                a: "Yes! Planova is built with responsive design, collapsible navigation, and touch-friendly controls that adapt smoothly from small mobile viewports to large desktop displays.",
              },
              {
                q: "How do scheduled reminders and in-app notifications work?",
                a: "You can schedule a reminder date and time for any task. When the deadline arrives, Planova automatically displays an in-app notification with an unread badge indicator on the top navigation bell.",
              },
              {
                q: "How does Planova ensure my tasks remain private?",
                a: "Each account is completely isolated using strict user authentication and data scoping. Non-admin users can only view and manage their own tasks.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`faq-item ${expandedFaq === idx ? "expanded" : ""}`}
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  aria-expanded={expandedFaq === idx}
                >
                  <span className="faq-q-text">{item.q}</span>
                  <span className="faq-toggle-icon" aria-hidden="true">
                    {expandedFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {expandedFaq === idx && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FINAL CALL TO ACTION
          ======================================================== */}
      <section className="landing-cta-banner" aria-labelledby="cta-heading">
        <div className="cta-glow-blob" aria-hidden="true" />
        <div className="cta-container">
          <h2 id="cta-heading" className="cta-title">
            Ready to take control of your day?
          </h2>
          <p className="cta-subtitle">
            Join Planova today to organize tasks smarter, focus on what matters, and accomplish more every day.
          </p>

          <div className="cta-buttons">
            <button type="button" className="btn btn-hero-primary" onClick={handleCtaClick}>
              <span>{isAuthenticated ? "Open Workspace" : "Get Started"}</span>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            {!isAuthenticated && (
              <button type="button" className="btn btn-hero-secondary" onClick={onNavigateLogin}>
                Sign In to Planova
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          8. FOOTER
          ======================================================== */}
      <footer className="landing-footer" aria-label="Footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="footer-brand-title">
              <div className="landing-logo-icon sm" aria-hidden="true">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.4" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="footer-logo-name">Planova</span>
            </div>
            <p className="footer-tagline">
              Organize Smarter. Achieve More.
            </p>
            <p className="footer-meta">
              Smart task management platform built for modern teams and professionals.
            </p>
          </div>

          <div className="footer-links-col">
            <span className="footer-links-heading">Explore</span>
            <button type="button" className="footer-link" onClick={() => scrollToSection("features")}>
              Features
            </button>
            <button type="button" className="footer-link" onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>
            <button type="button" className="footer-link" onClick={() => scrollToSection("preview")}>
              Showcase
            </button>
            <button type="button" className="footer-link" onClick={() => scrollToSection("faq")}>
              FAQ
            </button>
          </div>

          <div className="footer-links-col">
            <span className="footer-links-heading">Platform</span>
            <button type="button" className="footer-link" onClick={() => setModalContent("about")}>
              About Planova
            </button>
            <button type="button" className="footer-link" onClick={() => setModalContent("privacy")}>
              Data &amp; Security Policy
            </button>
            {isAuthenticated ? (
              <button type="button" className="footer-link" onClick={onNavigateApp}>
                My Workspace
              </button>
            ) : (
              <button type="button" className="footer-link" onClick={onNavigateLogin}>
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>&copy; 2026 Planova. All rights reserved.</span>
          <span>Designed for clarity, focus, and productivity.</span>
        </div>
      </footer>

      {/* Informational Modals for About & Privacy (No Dead Links) */}
      {modalContent && (
        <div className="landing-info-modal-backdrop" onClick={() => setModalContent(null)}>
          <div className="landing-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>{modalContent === "about" ? "About Planova" : "Data & Security Policy"}</h3>
              <button type="button" className="info-modal-close" onClick={() => setModalContent(null)}>
                &times;
              </button>
            </div>
            <div className="info-modal-body">
              {modalContent === "about" ? (
                <>
                  <p>
                    <strong>Planova</strong> is an intuitive, modern productivity platform designed to help
                    professionals and teams organize tasks, manage schedules, and achieve meaningful goals with
                    clarity and confidence.
                  </p>
                  <p>
                    <strong>Core Features:</strong>
                  </p>
                  <ul>
                    <li>Smart task tracking with priorities, categories, and deadlines.</li>
                    <li>Visual Kanban board for drag-and-drop workflow management.</li>
                    <li>Interactive monthly calendar planner with deadline visibility.</li>
                    <li>Subtask checklists and customizable tag organization.</li>
                    <li>Real-time productivity metrics and weekly progress charts.</li>
                    <li>Role-Based Access Control distinguishing team members from administrators.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    <strong>Data Privacy &amp; Security:</strong>
                  </p>
                  <p>
                    Planova takes your privacy and data security seriously:
                  </p>
                  <ul>
                    <li>Passwords are never stored in plaintext. All credentials are encrypted using industry-standard password hashing.</li>
                    <li>All user workspaces are strictly isolated. Non-admin users cannot access other accounts&apos; tasks.</li>
                    <li>User sessions are securely authenticated and verified on every request.</li>
                    <li>Your data is persisted in a protected, dedicated database with strict privacy boundaries.</li>
                  </ul>
                </>
              )}
            </div>
            <div className="info-modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setModalContent(null)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
