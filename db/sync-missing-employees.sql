-- Insert employees for users without employee records
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
    'EMP' || substr('00000' || CAST(u.id AS TEXT), -5, 5) as employee_id,
    substr(u.full_name, 1, instr(u.full_name || ' ', ' ') - 1) as first_name,
    substr(u.full_name, instr(u.full_name || ' ', ' ') + 1) as last_name,
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
    1 as department_id,
    50000 as base_salary,
    'USD' as currency,
    'system' as created_by,
    'system' as updated_by
FROM users u
LEFT JOIN employees e ON u.email = e.email
WHERE e.id IS NULL;
