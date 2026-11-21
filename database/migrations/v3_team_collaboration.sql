-- Planova Migration v3: Enterprise Team Collaboration & Task Assignment Upgrade
-- Adds exact due time to tasks, team_tasks, task_assignments, assignment_discussions,
-- and links assignment notifications.

SET FOREIGN_KEY_CHECKS=0;

-- 1. Extend tasks table with exact due time and timezone (preserving existing records)
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS due_time TIME NULL AFTER due_date,
  ADD COLUMN IF NOT EXISTS due_datetime DATETIME NULL AFTER due_time,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' AFTER due_datetime;

-- 2. Create team_tasks table (Shared task definition created by Admins)
CREATE TABLE IF NOT EXISTS team_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    instructions TEXT NULL,
    priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    due_date DATE NULL,
    due_time TIME NULL,
    due_datetime DATETIME NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    checklist JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_tasks_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_team_tasks_admin (admin_id),
    INDEX idx_team_tasks_due (due_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create task_assignments table (Independent recipient tracking records)
CREATE TABLE IF NOT EXISTS task_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_task_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('Pending', 'InProgress', 'Completed') NOT NULL DEFAULT 'Pending',
    progress_percent INT NOT NULL DEFAULT 0,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT NULL,
    blockers TEXT NULL,
    checklist_state JSON NULL,
    CONSTRAINT fk_ta_team_task FOREIGN KEY (team_task_id) REFERENCES team_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_team_task_user (team_task_id, user_id),
    INDEX idx_ta_user_status (user_id, status),
    INDEX idx_ta_team_task (team_task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create assignment_discussions table (Task-specific progress & communication)
CREATE TABLE IF NOT EXISTS assignment_discussions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_role ENUM('Admin', 'User') NOT NULL,
    message_type ENUM('comment', 'inquiry', 'progress_update', 'blocker_report', 'reminder', 'system') NOT NULL DEFAULT 'comment',
    message TEXT NOT NULL,
    progress_percent INT NULL,
    status_update ENUM('Pending', 'InProgress', 'Completed') NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ad_assignment FOREIGN KEY (assignment_id) REFERENCES task_assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_ad_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ad_assignment_created (assignment_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Extend notifications table with assignment link, action URL, and actor name
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS assignment_id INT NULL AFTER task_id,
  ADD COLUMN IF NOT EXISTS action_url VARCHAR(255) NULL AFTER message,
  ADD COLUMN IF NOT EXISTS actor_name VARCHAR(100) NULL AFTER action_url,
  ADD CONSTRAINT fk_notif_assignment FOREIGN KEY (assignment_id) REFERENCES task_assignments(id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS=1;
