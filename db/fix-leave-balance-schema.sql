-- Fix employee_leave_balances schema to allow multiple years per employee
-- 1. Rename existing table
ALTER TABLE employee_leave_balances RENAME TO employee_leave_balances_old;

-- 2. Create new table with CORRECT constraints (removed UNIQUE from employee_id)
CREATE TABLE employee_leave_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    paid_leave_quota REAL DEFAULT 15.0,
    paid_leave_used REAL DEFAULT 0.0,
    emergency_leave_used_count INTEGER DEFAULT 0,
    birthday_leave_used BOOLEAN DEFAULT 0,
    anniversary_leave_used BOOLEAN DEFAULT 0,
    maternity_leave_quota INTEGER DEFAULT 0,
    maternity_leave_used INTEGER DEFAULT 0,
    paternity_leave_quota INTEGER DEFAULT 0,
    paternity_leave_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, year)
);

-- 3. Copy data from old table
INSERT INTO employee_leave_balances (
    id, employee_id, year, paid_leave_quota, paid_leave_used, 
    emergency_leave_used_count, birthday_leave_used, anniversary_leave_used,
    maternity_leave_quota, maternity_leave_used, paternity_leave_quota, paternity_leave_used,
    created_at, updated_at
)
SELECT 
    id, employee_id, year, paid_leave_quota, paid_leave_used, 
    emergency_leave_used_count, birthday_leave_used, anniversary_leave_used,
    maternity_leave_quota, maternity_leave_used, paternity_leave_quota, paternity_leave_used,
    created_at, updated_at
FROM employee_leave_balances_old;

-- 4. Drop old table
DROP TABLE employee_leave_balances_old;

-- 5. Recreate Index
CREATE INDEX idx_leave_balances_employee ON employee_leave_balances(employee_id);
