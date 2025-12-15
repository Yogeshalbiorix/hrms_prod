-- Create admin user with hashed password for 'admin123'
-- bcrypt hash for 'admin123'
INSERT OR REPLACE INTO users (
  id, username, email, password_hash, full_name, role, is_active, created_at
) VALUES (
  1, 
  'admin', 
  'admin@hrms.com', 
  '$2a$10$8K1p/a0dL3.I9./cOE6b0.aZZL7Z3nQXvPjvLqHl8kF6Q3qwPJh6i',
  'System Administrator',
  'admin',
  1,
  CURRENT_TIMESTAMP
);

-- Create HR Manager 1 (with admin role)
INSERT OR IGNORE INTO employees (
  first_name, last_name, employee_id, email, phone, position, 
  join_date, base_salary, status
) VALUES (
  'HR', 'Manager', 'EMP001', 'hrmanager1@hrms.com', '1234567890',
  'HR Manager', '2024-01-01', 75000, 'active'
);

-- Get the employee_id for HR Manager 1
-- Create user account for HR Manager 1 with admin role
INSERT OR REPLACE INTO users (
  username, email, password_hash, full_name, role, employee_id, is_active, created_at
) VALUES (
  'hrmanager1',
  'hrmanager1@hrms.com',
  '$2a$10$8K1p/a0dL3.I9./cOE6b0.aZZL7Z3nQXvPjvLqHl8kF6Q3qwPJh6i',
  'HR Manager',
  'admin',
  (SELECT id FROM employees WHERE employee_id = 'EMP001'),
  1,
  CURRENT_TIMESTAMP
);

-- Create HR Manager 2 (with admin role)
INSERT OR IGNORE INTO employees (
  first_name, last_name, employee_id, email, phone, position, 
  join_date, base_salary, status
) VALUES (
  'HR', 'Executive', 'EMP002', 'hrmanager2@hrms.com', '1234567891',
  'HR Executive', '2024-01-01', 70000, 'active'
);

-- Create user account for HR Manager 2 with admin role
INSERT OR REPLACE INTO users (
  username, email, password_hash, full_name, role, employee_id, is_active, created_at
) VALUES (
  'hrmanager2',
  'hrmanager2@hrms.com',
  '$2a$10$8K1p/a0dL3.I9./cOE6b0.aZZL7Z3nQXvPjvLqHl8kF6Q3qwPJh6i',
  'HR Executive',
  'admin',
  (SELECT id FROM employees WHERE employee_id = 'EMP002'),
  1,
  CURRENT_TIMESTAMP
);

-- Display created users
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.role,
  u.employee_id,
  e.employee_id as emp_code,
  e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.role = 'admin'
ORDER BY u.id;
