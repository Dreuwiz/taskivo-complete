-- ══════════════════════════════════════════
--  TASKIVO  —  Supabase / PostgreSQL Schema
--  Paste this entire file into:
--  Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        TEXT    NOT NULL,
  email       TEXT    UNIQUE NOT NULL,
  password_hash TEXT  NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'user',   -- user | team_leader | manager | admin
  team        TEXT,
  avatar      TEXT,
  streak      INTEGER DEFAULT 0,
  status      TEXT    DEFAULT 'Active',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id                    SERIAL PRIMARY KEY,
  title                 TEXT    NOT NULL,
  assigned_to           TEXT,                          -- display name (denormalized for simplicity)
  assigned_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  team                  TEXT,
  status                TEXT    DEFAULT 'Pending',     -- Pending | In Progress | Under Review | Completed
  description           TEXT,
  priority              TEXT    DEFAULT 'Medium',      -- Low | Medium | High | Critical
  due                   DATE,
  subtasks              JSONB   DEFAULT '[]'::jsonb,
  userCompletions       JSONB   DEFAULT '{}'::jsonb,
  tlPendingAssignment   BOOLEAN DEFAULT false,
  assignedByManager     TEXT,
  assignedByManagerAt   TIMESTAMPTZ,
  tlAssignedBy          TEXT,
  tlAssignedAt          TIMESTAMPTZ,
  teamLeaderReviewed    BOOLEAN DEFAULT false,
  teamLeaderApprovedBy  TEXT,
  teamLeaderApprovedAt  TIMESTAMPTZ,
  reviewedBy            TEXT,
  rejectedBy            TEXT,
  rejectionReason       TEXT,
  completedAt           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  action       TEXT NOT NULL,
  performed_by TEXT,
  type         TEXT DEFAULT 'info',              -- info | success | danger | warning
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
--  SEED DATA  (hashed passwords = name + 123)
--  Hashes generated with bcrypt rounds=10
-- ══════════════════════════════════════════

INSERT INTO users (name, email, password_hash, role, team, avatar, streak, status) VALUES
  ('Alice Santos', 'alice@taskivo.com', '$2b$10$Hu6EvYWEw.LWcYV10QiMLuqfja/JLKytwM/CDpFIryyYhc0JH64HW', 'user',        'Alpha', 'AS', 4,  'Active'),
  ('Ben Cruz',     'ben@taskivo.com',   '$2b$10$/Di03JdizkpE//3pBmCoyeOXxZgVDnM0vNLjT3yWUJ3TRpvI6akRS', 'user',        'Alpha', 'BC', 7,  'Active'),
  ('Carla Reyes',  'carla@taskivo.com', '$2b$10$WV2T2xEp4gDfnRFhrpEciuTVgmcrVXM4KkFfI82dhAfoxK3Vsj5ei', 'user',        'Beta',  'CR', 12, 'Active'),
  ('Mia Vega',     'mia@taskivo.com',   '$2b$10$5LpgzjVwzA/UTheuDNL/dOdbdvlZ1j3P/U6C4DdrSLztbNiziIC/m', 'user',        'Beta',  'MV', 1,  'Inactive'),
  ('Dan Lim',      'dan@taskivo.com',   '$2b$10$3J4xnx.bhsZ5Rz9xYzi7v.A7VyzA/Jx8f74a32HsU8QpMnuxjDWni', 'team_leader', 'Alpha', 'DL', 9,  'Active'),
  ('Eva Tan',      'eva@taskivo.com',   '$2b$10$y72PuXdeOFsMWWxhSdJZOOabDBHMK1Ww42aOWE9NZ4OYhxTpPQOry', 'team_leader', 'Beta',  'ET', 5,  'Active'),
  ('Frank Ong',    'frank@taskivo.com', '$2b$10$K9tXJu49klwBk6BDBKUJ.urHc4ecUS8ogzvc4tc5pJL8NehFjqLle', 'manager',     NULL,    'FO', 3,  'Active'),
  ('Grace Ko',     'grace@taskivo.com', '$2b$10$hdcH6GX3jgvf5TjDr01xre.HOBp2E1m0LiYQdOvWTLs9ZvHAhIXwi', 'admin',       NULL,    'GK', 14, 'Active');
  ('Shadow',       'shadow@taskivo.com','$2b$10$Jm1HKN46UCVj8xi2VgY.fu02jiskPntkNOY9ClPgNn7qxhLeqYnUO', 'user',        'Alpha', 'S' , 0,  'Active')

-- NOTE: Run `node server/scripts/hashPasswords.js` first to get real bcrypt hashes,
-- then replace the placeholder hashes above before inserting.

INSERT INTO tasks (title, assigned_to, team, status, priority, due) VALUES
  ('Update project documentation', 'Alice Santos', 'Alpha', 'In Progress', 'High',     '2026-03-15'),
  ('Fix login page bug',           'Ben Cruz',     'Alpha', 'Completed',   'Critical',  '2026-03-13'),
  ('Conduct code review',          'Dan Lim',      'Alpha', 'In Progress', 'Medium',    '2026-03-14'),
  ('Design dashboard mockup',      'Carla Reyes',  'Beta',  'Completed',   'High',      '2026-03-12'),
  ('Q1 report compilation',        'Eva Tan',      'Beta',  'Pending',     'Critical',  '2026-03-16'),
  ('Onboard new team members',     'Mia Vega',     'Beta',  'Pending',     'Medium',    '2026-03-18'),
  ('Department performance review','Frank Ong',    NULL,    'In Progress', 'High',      '2026-03-19'),
  ('System-wide security audit',   'Grace Ko',     NULL,    'Pending',     'Low',       '2026-03-22');

INSERT INTO audit_log (action, performed_by, type) VALUES
  ('System initialized',          'System',    'info'),
  ('Seed data loaded',            'System',    'success');
