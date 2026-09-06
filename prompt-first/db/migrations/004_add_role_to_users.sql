ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'
  CHECK (role IN ('admin', 'editor', 'viewer'));
-- 初期ユーザーは username と同じロールを割り当てる(既存 DB にも適用)。
UPDATE users SET role = username WHERE username IN ('admin', 'editor', 'viewer');
