ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'
  CHECK (role IN ('admin', 'editor', 'viewer'));
UPDATE users SET role = username WHERE username IN ('admin', 'editor', 'viewer');
