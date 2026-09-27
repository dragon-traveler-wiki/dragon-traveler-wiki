-- Moderator-applied suspensions (timeouts and permanent bans) and an audit log
-- of moderation actions.
ALTER TABLE users ADD COLUMN suspended_until INTEGER;
ALTER TABLE users ADD COLUMN suspension_permanent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN suspension_reason TEXT NOT NULL DEFAULT '';

CREATE TABLE moderation_actions (
  id TEXT PRIMARY KEY,
  moderator_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('team', 'tier_list', 'user', 'report', 'setting')),
  target_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_moderation_actions_created ON moderation_actions(created_at DESC);
