-- Add half-day columns to employee_leave_history if they don't exist

-- We can't use IF NOT EXISTS for columns in SQLite directly in a simple ALTER TABLE statement if we want to be safe and idempotent in a single script without procedural code, 
-- but given the environment, we can just try to add them. If they exist, it might fail, so we should separate them or use a safer approach if possible.
-- However, for D1, we usually just run the ALTER.

ALTER TABLE employee_leave_history ADD COLUMN is_half_day BOOLEAN DEFAULT 0;
ALTER TABLE employee_leave_history ADD COLUMN half_day_period TEXT CHECK(half_day_period IN ('first_half', 'second_half'));
ALTER TABLE employee_leave_history ADD COLUMN duration REAL;
