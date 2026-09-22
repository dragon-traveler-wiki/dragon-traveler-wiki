ALTER TABLE users ADD COLUMN primary_provider TEXT
  CHECK (primary_provider IN ('github', 'discord'));

UPDATE users
SET primary_provider = (
  SELECT provider FROM oauth_identities
  WHERE oauth_identities.user_id = users.id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE primary_provider IS NULL;
