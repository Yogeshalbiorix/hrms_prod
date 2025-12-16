-- Sync users to employees table
-- Creates employee records for all users who don't have one

-- First, check which users don't have employee records
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role
FROM users u
LEFT JOIN employees e ON u.email = e.email
WHERE e.id IS NULL;

-- Create employee records for users without employee entries
INSERT INTO employees (
    employee_id,
    first_name,
    last_name,
    email,
    position,
    employment_type,
    status,
    join_date,
    department_id,
    base_salary,
    currency,
    created_by,
    updated_by
)
SELECT 
    'EMP' || substr('00000' || u.id, -5, 5) as employee_id,  -- Generate employee_id like EMP00001
    u.first_name,
    u.last_name,
    u.email,
    CASE 
        WHEN u.role = 'admin' THEN 'Administrator'
        WHEN u.role = 'hr' THEN 'HR Manager'
        WHEN u.role = 'manager' THEN 'Manager'
        ELSE 'Employee'
    END as position,
    'full-time' as employment_type,
    'active' as status,
    date('now') as join_date,
    1 as department_id,  -- Default department
    50000 as base_salary,  -- Default salary
    'USD' as currency,
    'system' as created_by,
    'system' as updated_by
FROM users u
LEFT JOIN employees e ON u.email = e.email
WHERE e.id IS NULL;

-- Verify the sync
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM employees) as total_employees,
    (SELECT COUNT(*) FROM users u 
     INNER JOIN employees e ON u.email = e.email) as synced_records;
