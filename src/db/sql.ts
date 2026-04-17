export const schemaSql = `
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  coins INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_level INTEGER NOT NULL,
  cost_coins INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  PRIMARY KEY (player_id, item_name)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS reward_claims (
  idempotency_key TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL REFERENCES rewards(id) ON DELETE CASCADE
);
`;
