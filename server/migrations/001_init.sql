-- Team Finder schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  username      VARCHAR(40)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  avatar        TEXT,
  bio           TEXT,
  job_title     VARCHAR(120),
  github_url    TEXT,
  telegram_url  TEXT,
  linkedin_url  TEXT,
  experience    VARCHAR(20) CHECK (experience IN ('junior', 'middle', 'senior', 'lead')),
  availability  VARCHAR(20) NOT NULL DEFAULT 'available'
                CHECK (availability IN ('available', 'part_time', 'busy')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT    NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS skills (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_skills_name_ci ON skills (LOWER(name));

CREATE TABLE IF NOT EXISTS user_skills (
  user_id  INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category    VARCHAR(60) NOT NULL,
  image       TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'recruiting'
              CHECK (status IN ('recruiting', 'active', 'completed', 'closed')),
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS project_roles (
  id             SERIAL PRIMARY KEY,
  project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name           VARCHAR(80) NOT NULL,
  description    TEXT,
  required_count INTEGER NOT NULL DEFAULT 1 CHECK (required_count > 0)
);
CREATE INDEX IF NOT EXISTS idx_project_roles_project ON project_roles(project_id);

CREATE TABLE IF NOT EXISTS role_skills (
  role_id  INTEGER NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id)        ON DELETE CASCADE,
  PRIMARY KEY (role_id, skill_id)
);

CREATE TABLE IF NOT EXISTS project_members (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role_id    INTEGER REFERENCES project_roles(id)     ON DELETE SET NULL,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

CREATE TABLE IF NOT EXISTS applications (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role_id    INTEGER REFERENCES project_roles(id)     ON DELETE SET NULL,
  message    TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- One active (pending) application per user per project.
CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_active
  ON applications(project_id, user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);

CREATE TABLE IF NOT EXISTS invitations (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id   INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role_id     INTEGER REFERENCES project_roles(id)     ON DELETE SET NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invitations_active
  ON invitations(project_id, receiver_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_receiver ON invitations(receiver_id);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id  INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_project_created ON messages(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(40) NOT NULL CHECK (type IN (
               'NEW_APPLICATION', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED',
               'NEW_INVITATION', 'NEW_MESSAGE', 'PROJECT_UPDATE')),
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  actor_id   INTEGER REFERENCES users(id)    ON DELETE SET NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
