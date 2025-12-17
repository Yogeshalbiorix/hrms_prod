-- Create employee records for specific users without employee_id
-- Starting from EMP007 to avoid conflicts

-- User ID 3: yogeshpurnawasi
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Yogesh', 'Purnawasi', 'EMP007', 'Yogesh.albiorix@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP007') WHERE id = 3;

-- User ID 4: pushpakmakwana
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Pushpak', 'Makwana', 'EMP008', 'pushpakm.albiorix@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP008') WHERE id = 4;

-- User ID 5: krishnaraval
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Krishna', 'Raval', 'EMP009', 'Krishna.albiorix@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP009') WHERE id = 5;

-- User ID 6: abhaybhatti
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Abhay', 'Bhatti', 'EMP010', 'abhay.albiorix@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP010') WHERE id = 6;

-- User ID 7: hirenm
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Hiren', 'M', 'EMP011', 'hiren.albiorix@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP011') WHERE id = 7;

-- User ID 10: kevaljain
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Keval', 'Jain', 'EMP012', 'kevalJain.albiorix@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP012') WHERE id = 10;

-- User ID 11: Yogeshp
INSERT INTO employees (first_name, last_name, employee_id, email, phone, position, department_id, join_date, base_salary, status)
VALUES ('Yogesh', 'P', 'EMP013', 'yogeshp@gmail.com', '0000000000', 'Employee', 1, '2024-01-01', 50000, 'active');

UPDATE users SET employee_id = (SELECT id FROM employees WHERE employee_id = 'EMP013') WHERE id = 11;

-- Display all users with their employee records
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.role,
    e.employee_id as emp_code,
    e.first_name || ' ' || e.last_name as full_name
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
ORDER BY u.id;
