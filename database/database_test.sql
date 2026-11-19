-- =============================================================
-- database_test.sql  |  Tests for todo_app  |  MySQL 8.0+
-- Run AFTER schema.sql (and optionally seed.sql).
--
-- SAFE: every data change happens inside ONE transaction that is
-- ROLLED BACK at the end, so your seed data is never altered.
-- The only object created outside the transaction is a helper
-- procedure that is dropped at the end.
--
-- Expected-failure tests print PASS when MySQL rejects the bad input.
-- In MySQL Workbench each SELECT appears as its own result tab.
-- =============================================================

USE todo_app;
SET SESSION sql_mode = CONCAT_WS(',', @@SESSION.sql_mode, 'STRICT_TRANS_TABLES');

-- ---------- Helper: runs a statement that SHOULD fail ----------
DROP PROCEDURE IF EXISTS sp_test_expect_error;
DELIMITER $$
CREATE PROCEDURE sp_test_expect_error(IN p_name VARCHAR(120), IN p_sql TEXT)
BEGIN
  DECLARE v_failed TINYINT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET v_failed = 1;
  SET @expect_error_sql = p_sql;
  PREPARE stmt FROM @expect_error_sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  SELECT p_name AS test_name,
         IF(v_failed = 1, 'PASS - rejected as expected', 'FAIL - was accepted') AS result;
END$$
DELIMITER ;

-- =============================================================
-- TEST 1: Database creation
-- =============================================================
SELECT SCHEMA_NAME AS database_found
FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'todo_app';

-- =============================================================
-- TEST 2: Table creation (expect exactly 3 tables)
-- =============================================================
SELECT TABLE_NAME, ENGINE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'todo_app' AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

SELECT IF(COUNT(*) = 3, 'PASS - 3 tables exist', 'FAIL - wrong table count') AS result
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'todo_app' AND TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME IN ('users', 'tasks', 'categories');

-- =============================================================
-- START OF TRANSACTION (everything below is rolled back at the end)
-- =============================================================
START TRANSACTION;

-- ---------- TEST 3: User insertion + default role ----------
INSERT INTO users (name, email, password_hash)
VALUES ('Test User One', 'test.user1@example.com', '$2b$10$DUMMYTESTHASH1');
SET @u1 = LAST_INSERT_ID();

INSERT INTO users (name, email, password_hash)
VALUES ('Test User Two', 'test.user2@example.com', '$2b$10$DUMMYTESTHASH2');
SET @u2 = LAST_INSERT_ID();

SELECT id, name, email, role,
       IF(role = 'User', 'PASS - default role is User', 'FAIL') AS result
FROM users WHERE id IN (@u1, @u2);

-- ---------- TEST 4: Admin insertion ----------
INSERT INTO users (name, email, password_hash, role)
VALUES ('Test Admin', 'test.admin@example.com', '$2b$10$DUMMYTESTHASHADMIN', 'Admin');
SET @adm = LAST_INSERT_ID();

SELECT id, name, role,
       IF(role = 'Admin', 'PASS - Admin stored', 'FAIL') AS result
FROM users WHERE id = @adm;

-- ---------- TEST 5: Category creation ----------
INSERT INTO categories (user_id, name) VALUES (@u1, 'Test Study');
SET @c1 = LAST_INSERT_ID();
INSERT INTO categories (user_id, name) VALUES (@u2, 'Test Work');
SET @c2 = LAST_INSERT_ID();

SELECT id, user_id, name FROM categories WHERE id IN (@c1, @c2);

-- ---------- TEST 6: Task creation (with and without category, defaults) ----------
INSERT INTO tasks (user_id, category_id, title, description, due_date)
VALUES (@u1, @c1, 'Test task with category', 'Uses default status and priority', '2026-12-01');
SET @t1 = LAST_INSERT_ID();

INSERT INTO tasks (user_id, title, status, priority, due_date)
VALUES (@u1, 'Test task without category', 'InProgress', 'High', '2026-11-30');
SET @t2 = LAST_INSERT_ID();

INSERT INTO tasks (user_id, category_id, title, status, priority)
VALUES (@u2, @c2, 'Test task of user two', 'Completed', 'Low');
SET @t3 = LAST_INSERT_ID();

SELECT id, title, status, priority, category_id,
       IF(id = @t1 AND status = 'Pending' AND priority = 'Medium',
          'PASS - defaults Pending/Medium', '') AS default_check
FROM tasks WHERE id IN (@t1, @t2, @t3);

-- ---------- TEST 7: Task retrieval (only own tasks) ----------
SELECT id, title, status, priority, due_date
FROM tasks WHERE user_id = @u1;

-- ---------- TEST 8: Task update (mark completed) ----------
UPDATE tasks SET status = 'Completed', title = 'Test task with category (edited)'
WHERE id = @t1 AND user_id = @u1;

SELECT id, title, status, updated_at FROM tasks WHERE id = @t1;

-- ---------- TEST 9: Task deletion (only our own test task) ----------
DELETE FROM tasks WHERE id = @t2 AND user_id = @u1;

SELECT IF(COUNT(*) = 0, 'PASS - task deleted', 'FAIL') AS result
FROM tasks WHERE id = @t2;

-- ---------- TEST 10: Relationship queries ----------
-- User -> Tasks
SELECT u.name AS user_name, t.title
FROM users u JOIN tasks t ON t.user_id = u.id
WHERE u.id IN (@u1, @u2) ORDER BY u.id, t.id;

-- User -> Categories
SELECT u.name AS user_name, c.name AS category_name
FROM users u JOIN categories c ON c.user_id = u.id
WHERE u.id IN (@u1, @u2) ORDER BY u.id, c.id;

-- Category -> Tasks (LEFT JOIN shows uncategorized tasks too)
SELECT c.name AS category_name, t.title
FROM tasks t LEFT JOIN categories c ON c.id = t.category_id
WHERE t.user_id IN (@u1, @u2) ORDER BY t.id;

-- ---------- TEST 11: Filtering, search and sorting ----------
SELECT id, title, status FROM tasks WHERE user_id IN (@u1, @u2) AND status = 'Pending';
SELECT id, title, status FROM tasks WHERE user_id IN (@u1, @u2) AND status = 'Completed';
SELECT id, title FROM tasks WHERE user_id IN (@u1, @u2) AND title LIKE '%category%';

-- Sort by due date (tasks without a date last), then priority High -> Low
SELECT id, title, due_date, priority
FROM tasks WHERE user_id IN (@u1, @u2)
ORDER BY due_date IS NULL, due_date ASC, FIELD(priority, 'High', 'Medium', 'Low');

-- ---------- TEST 12: Expected rejections ----------
CALL sp_test_expect_error('Duplicate email rejected',
  'INSERT INTO users (name, email, password_hash) VALUES (''Dup'', ''test.user1@example.com'', ''x'')');

CALL sp_test_expect_error('Invalid role rejected',
  'INSERT INTO users (name, email, password_hash, role) VALUES (''Bad'', ''bad.role@example.com'', ''x'', ''Manager'')');

CALL sp_test_expect_error('Invalid status rejected',
  CONCAT('INSERT INTO tasks (user_id, title, status) VALUES (', @u1, ', ''Bad status'', ''Done'')'));

CALL sp_test_expect_error('Invalid priority rejected',
  CONCAT('INSERT INTO tasks (user_id, title, priority) VALUES (', @u1, ', ''Bad priority'', ''Urgent'')'));

CALL sp_test_expect_error('Task with non-existent user rejected (FK)',
  'INSERT INTO tasks (user_id, title) VALUES (999999999, ''Orphan task'')');

CALL sp_test_expect_error('Category with non-existent user rejected (FK)',
  'INSERT INTO categories (user_id, name) VALUES (999999999, ''Orphan category'')');

CALL sp_test_expect_error('Task with non-existent category rejected (FK)',
  CONCAT('INSERT INTO tasks (user_id, category_id, title) VALUES (', @u1, ', 999999999, ''Bad category'')'));

CALL sp_test_expect_error('Task using ANOTHER user''s category rejected',
  CONCAT('INSERT INTO tasks (user_id, category_id, title) VALUES (', @u1, ', ', @c2, ', ''Cross-user category'')'));

CALL sp_test_expect_error('Moving task to another user''s category rejected',
  CONCAT('UPDATE tasks SET category_id = ', @c2, ' WHERE id = ', @t1));

CALL sp_test_expect_error('Deleting a user who still owns tasks is blocked',
  CONCAT('DELETE FROM users WHERE id = ', @u1));

CALL sp_test_expect_error('Duplicate category name for same user rejected',
  CONCAT('INSERT INTO categories (user_id, name) VALUES (', @u1, ', ''Test Study'')'));

-- ---------- TEST 13: Deleting a category keeps its tasks ----------
DELETE FROM categories WHERE id = @c1;

SELECT id, title, category_id,
       IF(category_id IS NULL, 'PASS - task kept, category cleared', 'FAIL') AS result
FROM tasks WHERE id = @t1;

-- ---------- TEST 14: Admin statistics ----------
SELECT COUNT(*) AS total_users FROM users;
SELECT role, COUNT(*) AS users_count FROM users GROUP BY role;
SELECT COUNT(*) AS total_tasks FROM tasks;

SELECT status, COUNT(*) AS task_count FROM tasks GROUP BY status;
SELECT COUNT(*) AS pending_tasks   FROM tasks WHERE status = 'Pending';
SELECT COUNT(*) AS completed_tasks FROM tasks WHERE status = 'Completed';

SELECT priority, COUNT(*) AS task_count
FROM tasks GROUP BY priority ORDER BY FIELD(priority, 'High', 'Medium', 'Low');

-- Admin: all tasks together with their owners
SELECT t.id, u.name AS owner, u.role, t.title, t.status, t.priority
FROM tasks t JOIN users u ON u.id = t.user_id
ORDER BY t.id;

-- =============================================================
-- END OF TESTS: undo everything done above
-- =============================================================
ROLLBACK;

SELECT IF(COUNT(*) = 0, 'PASS - test data rolled back', 'FAIL - test data remains') AS cleanup_check
FROM users WHERE email LIKE 'test.%@example.com';

DROP PROCEDURE IF EXISTS sp_test_expect_error;
