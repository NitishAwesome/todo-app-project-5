 -- =============================================================
-- schema.sql  |  To-Do Web Application  |  MySQL 8.0+
-- Author: Sarthak Santosh Kene (Database design)
-- Creates the todo_app database with 3 tables: users, categories, tasks
-- Safe to re-run: uses IF NOT EXISTS and never drops anything.
-- =============================================================

CREATE DATABASE IF NOT EXISTS todo_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todo_app;

-- -------------------------------------------------------------
-- 1. USERS  (stores both 'User' and 'Admin' roles)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,   -- hash only, never plain text
  role          ENUM('User', 'Admin') NOT NULL DEFAULT 'User',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,   -- 1 = active, 0 = deactivated
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  
  
                

  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_users_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0),

  INDEX idx_users_role (role)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 2. CATEGORIES  (each category belongs to exactly one user)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_categories PRIMARY KEY (id),

  -- Needed so tasks can reference (category id + owner) together.
  CONSTRAINT uq_categories_id_user UNIQUE (id, user_id),

  -- A user cannot have two categories with the same name.
  CONSTRAINT uq_categories_user_name UNIQUE (user_id, name),

  CONSTRAINT chk_categories_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0),

  -- RESTRICT: a user who still owns categories cannot be deleted by accident.
  CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 3. TASKS  (belong to one user, optionally to one category)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  category_id INT          NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  status      ENUM('Pending', 'InProgress', 'Completed') NOT NULL DEFAULT 'Pending',
  priority    ENUM('Low', 'Medium', 'High')              NOT NULL DEFAULT 'Medium',
  due_date    DATE         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_tasks PRIMARY KEY (id),
  CONSTRAINT chk_tasks_title_not_blank CHECK (CHAR_LENGTH(TRIM(title)) > 0),

  -- Task owner. RESTRICT: users with tasks cannot be deleted by accident.
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Task category MUST belong to the SAME user as the task.
  -- Composite FK (category_id, user_id) -> categories (id, user_id).
  -- When category_id is NULL, MySQL skips this check (category is optional).
  -- RESTRICT is used because SET NULL would also try to null user_id;
  -- the trigger below un-assigns tasks before a category is deleted.
  CONSTRAINT fk_tasks_category_same_user
    FOREIGN KEY (category_id, user_id) REFERENCES categories (id, user_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,

  INDEX idx_tasks_user_id     (user_id),
  INDEX idx_tasks_category_id (category_id),
  INDEX idx_tasks_status      (status),
  INDEX idx_tasks_priority    (priority),
  INDEX idx_tasks_due_date    (due_date),
  INDEX idx_tasks_title       (title),
  INDEX idx_tasks_user_status (user_id, status),
  INDEX idx_tasks_user_due    (user_id, due_date)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Deleting a category keeps its tasks: they simply become
-- "uncategorized" (category_id = NULL).
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_categories_before_delete;

CREATE TRIGGER trg_categories_before_delete
BEFORE DELETE ON categories
FOR EACH ROW
  UPDATE tasks SET category_id = NULL WHERE category_id = OLD.id;
