-- Verify Organization Hierarchy Setup
-- Run this to check if hierarchy columns exist and view current setup

-- Check if hierarchy columns exist
PRAGMA table_info(employees);

-- View all employees with their hierarchy information
SELECT 
    id,
    employee_id,
    first_name || ' ' || last_name as name,
    position,
    department_name,
    manager_id,
    hierarchy_level,
    CASE 
        WHEN manager_id IS NULL THEN 'Top Level (No Manager)'
        ELSE 'Reports to ID: ' || manager_id
    END as reporting_structure
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY hierarchy_level, manager_id, first_name;

-- Count employees by hierarchy level
SELECT 
    COALESCE(hierarchy_level, 0) as level,
    COUNT(*) as count,
    CASE 
        WHEN hierarchy_level = 1 THEN 'Executive (CEO, Directors)'
        WHEN hierarchy_level = 2 THEN 'Senior Management'
        WHEN hierarchy_level = 3 THEN 'Middle Management'
        WHEN hierarchy_level = 4 THEN 'Staff'
        WHEN hierarchy_level = 5 THEN 'Junior Staff'
        ELSE 'Unassigned'
    END as level_description
FROM employees
GROUP BY hierarchy_level
ORDER BY hierarchy_level;

-- Show reporting relationships (who reports to whom)
SELECT 
    m.first_name || ' ' || m.last_name as manager,
    m.position as manager_position,
    e.first_name || ' ' || e.last_name as employee,
    e.position as employee_position
FROM employees e
INNER JOIN employees m ON e.manager_id = m.id
ORDER BY m.last_name, e.last_name;

-- Find employees without managers (top-level)
SELECT 
    employee_id,
    first_name || ' ' || last_name as name,
    position,
    department_name,
    hierarchy_level
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE manager_id IS NULL
ORDER BY hierarchy_level;
