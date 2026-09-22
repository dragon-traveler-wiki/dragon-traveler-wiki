PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE oauth_identities (
  provider TEXT NOT NULL CHECK (provider IN ('github', 'discord')),
  provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE oauth_states (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'discord')),
  mode TEXT NOT NULL CHECK (mode IN ('login', 'link')),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,
  return_to TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX oauth_states_expiry_idx ON oauth_states(expires_at);

CREATE TABLE community_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('team', 'tier_list')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  content_type TEXT NOT NULL,
  facet TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX community_items_listing_idx
  ON community_items(kind, status, score DESC, created_at DESC, id DESC);
CREATE INDEX community_items_owner_idx ON community_items(owner_user_id, updated_at DESC);
CREATE INDEX community_items_filters_idx ON community_items(kind, status, content_type, facet);

CREATE TABLE community_revisions (
  item_id TEXT NOT NULL REFERENCES community_items(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  editor_user_id TEXT NOT NULL REFERENCES users(id),
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (item_id, revision)
);

CREATE TABLE votes (
  item_id TEXT NOT NULL REFERENCES community_items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (item_id, user_id)
);

CREATE INDEX votes_user_idx ON votes(user_id, created_at DESC);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES community_items(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'broken', 'abusive', 'other')),
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolution_note TEXT NOT NULL DEFAULT '',
  resolved_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  UNIQUE (item_id, reporter_user_id)
);

CREATE INDEX reports_queue_idx ON reports(status, created_at ASC);
