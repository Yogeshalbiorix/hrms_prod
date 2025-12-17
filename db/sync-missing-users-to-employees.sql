-- Create employee records for all users without employee_id

INSERT INTO employees (
    first_name, 
    last_name, 
    employee_id, 
    email, 
    phone, 
    position, 
    department_id, 
    join_date, 
    base_salary, 
    status
)
SELECT 
    substr(u.username, 1, instr(u.username || ' ', ' ') - 1) as first_name,
    substr(u.username, instr(u.username || ' ', ' ') + 1) as last_name,
    'EMP' || substr('000' || u.id, -3) as employee_id,
    u.email,
    '0000000000' as phone,
    'Employee' as position,
    1 as department_id,
    '2024-01-01' as join_date,
    50000 as base_salary,
    'active' as status
FROM users u
WHERE u.employee_id IS NULL;

-- Update users to link them with their new employee records
UPDATE users
SET employee_id = (
    SELECT e.id 
    FROM employees e 
    WHERE e.email = users.email
)
WHERE employee_id IS NULL;

-- Display all users with their employee records
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.role,
    u.employee_id,
    e.employee_id as emp_code,
    e.first_name,
    e.last_name
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
ORDER BY u.id;
