-- =============================================================
-- seed.sql  |  Sample data for todo_app  |  MySQL 8.0+
-- Run AFTER schema.sql. Run ONCE on an empty database
-- (re-running will fail on the duplicate emails - that is intended).
-- Password hashes below are DUMMY values, not real credentials.
-- =============================================================

USE todo_app;

-- ---------- USERS ----------
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin One',     'admin@example.com',   '$2b$10$DUMMYHASHADMIN000000000000000000000000000000000000000', 'Admin'),
  ('Alice Sharma',  'alice@example.com',   '$2b$10$DUMMYHASHALICE000000000000000000000000000000000000000', 'User'),
  ('Bob Patil',     'bob@example.com',     '$2b$10$DUMMYHASHBOB00000000000000000000000000000000000000000', 'User'),
  ('Charlie Joshi', 'charlie@example.com', '$2b$10$DUMMYHASHCHARLIE0000000000000000000000000000000000000', 'User');

-- Look up ids by email (no hard-coded ids)
SET @admin_id   = (SELECT id FROM users WHERE email = 'admin@example.com');
SET @alice_id   = (SELECT id FROM users WHERE email = 'alice@example.com');
SET @bob_id     = (SELECT id FROM users WHERE email = 'bob@example.com');
SET @charlie_id = (SELECT id FROM users WHERE email = 'charlie@example.com');

-- ---------- CATEGORIES ----------
INSERT INTO categories (user_id, name) VALUES
  (@alice_id, 'Study'),
  (@alice_id, 'Personal'),
  (@bob_id,   'Projects'),
  (@bob_id,   'Study'),
  (@admin_id, 'Administration');

SET @alice_study    = (SELECT id FROM categories WHERE user_id = @alice_id AND name = 'Study');
SET @alice_personal = (SELECT id FROM categories WHERE user_id = @alice_id AND name = 'Personal');
SET @bob_projects   = (SELECT id FROM categories WHERE user_id = @bob_id   AND name = 'Projects');
SET @bob_study      = (SELECT id FROM categories WHERE user_id = @bob_id   AND name = 'Study');
SET @admin_cat      = (SELECT id FROM categories WHERE user_id = @admin_id AND name = 'Administration');

-- ---------- TASKS ----------
INSERT INTO tasks (user_id, category_id, title, description, status, priority, due_date) VALUES
  (@alice_id, @alice_study,    'Finish DBMS assignment',  'Normalization exercises 1-5',        'InProgress', 'High',   '2026-12-05'),
  (@alice_id, @alice_study,    'Revise Operating Systems','Chapters 4 to 7',                    'Pending',    'Medium', '2026-12-10'),
  (@alice_id, @alice_personal, 'Buy a birthday gift',     NULL,                                 'Pending',    'Low',    '2026-11-25'),
  (@alice_id, NULL,            'Renew library card',      'Uncategorized task example',         'Completed',  'Low',    NULL),
  (@bob_id,   @bob_projects,   'Design To-Do UI',         'Wireframes for dashboard',           'Completed',  'High',   '2026-11-15'),
  (@bob_id,   @bob_projects,   'Write API documentation', 'Document all endpoints',             'Pending',    'High',   '2026-12-01'),
  (@bob_id,   @bob_study,      'Prepare for viva',        NULL,                                 'InProgress', 'Medium', '2026-12-15'),
  (@bob_id,   NULL,            'Pay hostel fees',         NULL,                                 'Pending',    'Medium', '2026-11-30'),
  (@charlie_id, NULL,          'Join coding club',        'No categories created yet',          'Pending',    'Low',    NULL),
  (@charlie_id, NULL,          'Submit lab journal',      NULL,                                 'Completed',  'Medium', '2026-11-10'),
  (@admin_id, @admin_cat,      'Review user accounts',    'Monthly review',                     'Pending',    'High',   '2026-12-20');

-- Quick confirmation
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'tasks',      COUNT(*) FROM tasks;
