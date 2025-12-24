-- Leave Balances Table
CREATE TABLE employee_leave_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    
    -- Paid Leave (15/year)
    paid_leave_quota REAL DEFAULT 15.0,
    paid_leave_used REAL DEFAULT 0.0,
    
    -- Emergency Leave (Quota resets monthly, but track annual usage or flag for month)
    -- Complex logic requires tracking per month. For simplicity here:
    -- We'll track usage counts. Monthly reset logic will be in API code (checking usage in current month from history).
    emergency_leave_used_count INTEGER DEFAULT 0, 

    -- One-time/Annual boolean flags
    birthday_leave_used BOOLEAN DEFAULT 0,
    anniversary_leave_used BOOLEAN DEFAULT 0,
    
    -- Maternity/Paternity (One time per valid event, usually tracked by history, but balance can store eligibility/allocation)
    maternity_leave_quota INTEGER DEFAULT 0, -- 90 days if eligible
    maternity_leave_used INTEGER DEFAULT 0,
    
    paternity_leave_quota INTEGER DEFAULT 0, -- 15 days
    paternity_leave_used INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, year)
);

-- Index
CREATE INDEX idx_leave_balances_employee ON employee_leave_balances(employee_id);
