-- Migration to support new leave types and preserve recent columns
-- 1. Rename existing table
ALTER TABLE employee_leave_history RENAME TO employee_leave_history_old;

-- 2. Create new table with expanded CHECK constraint and ALL columns
CREATE TABLE employee_leave_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT CHECK(leave_type IN ('sick', 'vacation', 'personal', 'paid_leave', 'maternity', 'paternity', 'unpaid', 'emergency', 'birthday', 'anniversary', 'partial', 'comp_off', 'overseas')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    approved_by TEXT,
    approval_date DATETIME,
    notes TEXT,
    rejection_reason TEXT,
    duration REAL DEFAULT 1.0,
    is_half_day BOOLEAN DEFAULT 0,
    half_day_period TEXT CHECK(half_day_period IN ('first_half', 'second_half')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 3. Copy data from old table
-- Note: We map columns carefully. If old table has these columns, this works.
-- If old table was JUST added partial columns via ALTER, they exist.
INSERT INTO employee_leave_history (
    id, employee_id, leave_type, start_date, end_date, total_days, reason, status, 
    approved_by, approval_date, notes, rejection_reason, duration, is_half_day, half_day_period, 
    created_at, updated_at
)
SELECT 
    id, employee_id, leave_type, start_date, end_date, total_days, reason, status, 
    approved_by, approval_date, notes, rejection_reason, duration, is_half_day, half_day_period, 
    created_at, updated_at
FROM employee_leave_history_old;

-- 4. Drop old table
DROP TABLE employee_leave_history_old;

-- 5. Recreate Indices
CREATE INDEX idx_leave_employee ON employee_leave_history(employee_id);
CREATE INDEX idx_leave_status ON employee_leave_history(status);
