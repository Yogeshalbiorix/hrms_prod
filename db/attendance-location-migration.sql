-- Add location tracking to attendance table
-- This migration adds location column to store GPS coordinates and address

-- First check if attendance table exists, if not create it
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    user_id INTEGER,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    working_hours TEXT,
    work_mode TEXT DEFAULT 'office',
    status TEXT CHECK(status IN ('present', 'absent', 'late', 'half-day', 'on-leave')) DEFAULT 'present',
    notes TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add location column if it doesn't exist (for existing tables)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll use a safe approach
-- The column will store JSON with structure: {"latitude": 123, "longitude": 456, "address": "...", "timestamp": "..."}
