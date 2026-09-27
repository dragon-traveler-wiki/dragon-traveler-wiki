-- Site-wide, moderator-managed settings (e.g. the reference tier list).
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by_user_id TEXT REFERENCES users(id)
);
