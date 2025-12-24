-- SQL script to create password_reset_tokens table for forgot password feature
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES employees(id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
