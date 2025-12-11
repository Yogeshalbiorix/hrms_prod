-- Test Queries for HRMS Database
-- Use these to test your database setup

-- ==========================================
-- SELECT QUERIES
-- ==========================================

-- Get all employees with department names
SELECT 
    e.id,
    e.employee_id,
    e.first_name || ' ' || e.last_name as full_name,
    e.email,
    e.position,
    e.status,
    d.name as department,
    e.base_salary
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY e.created_at DESC;

-- Get employee count by department
SELECT 
    d.name as department,
    COUNT(e.id) as employee_count,
    SUM(e.base_salary) as total_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
GROUP BY d.id, d.name
ORDER BY employee_count DESC;

-- Get employee count by status
SELECT 
    status,
    COUNT(*) as count
FROM employees
GROUP BY status;

-- Get employees who joined in the last 6 months
SELECT 
    employee_id,
    first_name || ' ' || last_name as name,
    position,
    join_date
FROM employees
WHERE join_date >= DATE('now', '-6 months')
ORDER BY join_date DESC;

-- Get average salary by department
SELECT 
    d.name as department,
    ROUND(AVG(e.base_salary), 2) as avg_salary,
    MIN(e.base_salary) as min_salary,
    MAX(e.base_salary) as max_salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.status = 'active'
GROUP BY d.id, d.name
ORDER BY avg_salary DESC;

-- Get today's attendance
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name as name,
    a.check_in_time,
    a.check_out_time,
    a.status
FROM employee_attendance a
JOIN employees e ON a.employee_id = e.id
WHERE a.attendance_date = DATE('now')
ORDER BY a.check_in_time;

-- Get pending leave requests
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name as name,
    l.leave_type,
    l.start_date,
    l.end_date,
    l.total_days,
    l.reason,
    l.created_at
FROM employee_leave_history l
JOIN employees e ON l.employee_id = e.id
WHERE l.status = 'pending'
ORDER BY l.created_at DESC;

-- Get employees on leave today
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name as name,
    l.leave_type,
    l.start_date,
    l.end_date
FROM employee_leave_history l
JOIN employees e ON l.employee_id = e.id
WHERE l.status = 'approved'
  AND DATE('now') BETWEEN l.start_date AND l.end_date;

-- ==========================================
-- INSERT QUERIES
-- ==========================================

-- Insert a new employee
INSERT INTO employees (
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    department_id,
    position,
    employment_type,
    status,
    join_date,
    base_salary,
    created_by
) VALUES (
    'EMP006',
    'Alice',
    'Williams',
    'alice.williams@company.com',
    '+1-234-567-8906',
    1,
    'Junior Developer',
    'full-time',
    'active',
    '2024-01-22',
    65000.00,
    'system'
);

-- Insert multiple employees
INSERT INTO employees (employee_id, first_name, last_name, email, department_id, position, join_date, base_salary)
VALUES 
    ('EMP007', 'Bob', 'Davis', 'bob.davis@company.com', 2, 'Sales Representative', '2024-01-15', 55000.00),
    ('EMP008', 'Carol', 'Miller', 'carol.miller@company.com', 3, 'HR Coordinator', '2024-01-18', 58000.00);

-- Insert attendance record
INSERT INTO employee_attendance (
    employee_id,
    attendance_date,
    check_in_time,
    check_out_time,
    status
) VALUES (
    1,
    DATE('now'),
    '08:45:00',
    '17:30:00',
    'present'
);

-- Insert leave request
INSERT INTO employee_leave_history (
    employee_id,
    leave_type,
    start_date,
    end_date,
    total_days,
    reason,
    status
) VALUES (
    1,
    'vacation',
    '2024-02-15',
    '2024-02-20',
    6,
    'Family vacation',
    'pending'
);

-- ==========================================
-- UPDATE QUERIES
-- ==========================================

-- Update employee position and salary
UPDATE employees 
SET 
    position = 'Senior Developer',
    base_salary = 95000.00,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'admin'
WHERE employee_id = 'EMP001';

-- Update employee status to on-leave
UPDATE employees
SET 
    status = 'on-leave',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Update employee department
UPDATE employees
SET 
    department_id = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE employee_id = 'EMP001';

-- Approve leave request
UPDATE employee_leave_history
SET 
    status = 'approved',
    approved_by = 'manager@company.com',
    approval_date = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Update multiple employees' salary (e.g., annual raise)
UPDATE employees
SET 
    base_salary = base_salary * 1.05,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'annual_raise'
WHERE status = 'active' 
  AND department_id = 1;

-- ==========================================
-- DELETE QUERIES
-- ==========================================

-- Soft delete employee (set status to terminated)
UPDATE employees
SET 
    status = 'terminated',
    termination_date = DATE('now'),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Hard delete employee (use with caution!)
-- DELETE FROM employees WHERE id = 1;

-- Delete old attendance records (older than 1 year)
DELETE FROM employee_attendance
WHERE attendance_date < DATE('now', '-1 year');

-- Delete cancelled leave requests
DELETE FROM employee_leave_history
WHERE status = 'cancelled';

-- ==========================================
-- COMPLEX QUERIES
-- ==========================================

-- Get employees with their leave balance (assuming 20 days per year)
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name as name,
    20 as total_annual_leave,
    COALESCE(SUM(CASE WHEN l.status = 'approved' THEN l.total_days ELSE 0 END), 0) as used_days,
    20 - COALESCE(SUM(CASE WHEN l.status = 'approved' THEN l.total_days ELSE 0 END), 0) as remaining_days
FROM employees e
LEFT JOIN employee_leave_history l ON e.id = l.employee_id 
    AND strftime('%Y', l.start_date) = strftime('%Y', 'now')
WHERE e.status = 'active'
GROUP BY e.id, e.employee_id, e.first_name, e.last_name
ORDER BY remaining_days ASC;

-- Get attendance summary for each employee this month
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name as name,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
    COUNT(CASE WHEN a.status = 'on-leave' THEN 1 END) as leave_days,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0) / 
        COUNT(*), 2
    ) as attendance_percentage
FROM employees e
LEFT JOIN employee_attendance a ON e.id = a.employee_id
    AND strftime('%Y-%m', a.attendance_date) = strftime('%Y-%m', 'now')
WHERE e.status = 'active'
GROUP BY e.id, e.employee_id, e.first_name, e.last_name
ORDER BY attendance_percentage DESC;

-- Get department performance metrics
SELECT 
    d.name as department,
    COUNT(DISTINCT e.id) as total_employees,
    ROUND(AVG(e.base_salary), 2) as avg_salary,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_employees,
    COUNT(DISTINCT l.id) as pending_leave_requests
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
LEFT JOIN employee_leave_history l ON e.id = l.employee_id AND l.status = 'pending'
GROUP BY d.id, d.name
ORDER BY total_employees DESC;

-- Get employees with upcoming work anniversaries (next 30 days)
SELECT 
    employee_id,
    first_name || ' ' || last_name as name,
    join_date,
    DATE('now', 'start of year', 
         '+' || CAST(strftime('%m', join_date) - 1 AS TEXT) || ' months',
         '+' || CAST(strftime('%d', join_date) - 1 AS TEXT) || ' days') as next_anniversary,
    (strftime('%Y', 'now') - strftime('%Y', join_date)) as years_of_service
FROM employees
WHERE status = 'active'
  AND DATE('now', 'start of year', 
           '+' || CAST(strftime('%m', join_date) - 1 AS TEXT) || ' months',
           '+' || CAST(strftime('%d', join_date) - 1 AS TEXT) || ' days')
      BETWEEN DATE('now') AND DATE('now', '+30 days')
ORDER BY next_anniversary;

-- Get salary distribution statistics
SELECT 
    CASE 
        WHEN base_salary < 50000 THEN '< $50K'
        WHEN base_salary < 70000 THEN '$50K - $70K'
        WHEN base_salary < 90000 THEN '$70K - $90K'
        WHEN base_salary < 110000 THEN '$90K - $110K'
        ELSE '$110K+'
    END as salary_range,
    COUNT(*) as employee_count,
    ROUND(AVG(base_salary), 2) as avg_salary_in_range
FROM employees
WHERE status = 'active'
GROUP BY salary_range
ORDER BY MIN(base_salary);

-- ==========================================
-- UTILITY QUERIES
-- ==========================================

-- Check database structure
SELECT name, type 
FROM sqlite_master 
WHERE type IN ('table', 'index')
ORDER BY type, name;

-- Get table row counts
SELECT 
    'employees' as table_name, 
    COUNT(*) as row_count 
FROM employees
UNION ALL
SELECT 
    'departments', 
    COUNT(*) 
FROM departments
UNION ALL
SELECT 
    'employee_attendance', 
    COUNT(*) 
FROM employee_attendance
UNION ALL
SELECT 
    'employee_leave_history', 
    COUNT(*) 
FROM employee_leave_history;

-- Get employee table info
PRAGMA table_info(employees);

-- Check foreign key constraints
PRAGMA foreign_keys;
PRAGMA foreign_key_list(employees);
