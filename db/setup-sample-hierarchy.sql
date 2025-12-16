-- Sample Organization Hierarchy Setup
-- This script sets up a basic organizational hierarchy for testing
-- Adjust IDs based on your actual employee IDs

-- First, let's see what employees we have
SELECT id, employee_id, first_name, last_name, position FROM employees ORDER BY id;

-- Example: Setting up a sample hierarchy
-- Replace these IDs with actual employee IDs from your database

-- Step 1: Set CEO/Top Level (no manager, hierarchy level 1)
-- UPDATE employees SET manager_id = NULL, hierarchy_level = 1 
-- WHERE id = 1; -- Replace with actual CEO employee ID

-- Step 2: Set Senior Management (reports to CEO, hierarchy level 2)
-- UPDATE employees SET manager_id = 1, hierarchy_level = 2 
-- WHERE id IN (2, 3); -- Replace with actual senior manager IDs

-- Step 3: Set Middle Management (reports to senior managers, hierarchy level 3)
-- UPDATE employees SET manager_id = 2, hierarchy_level = 3 
-- WHERE id IN (4, 5); -- Replace with actual middle manager IDs

-- Step 4: Set Staff (reports to middle managers, hierarchy level 4)
-- UPDATE employees SET manager_id = 4, hierarchy_level = 4 
-- WHERE id IN (6, 7, 8); -- Replace with actual staff IDs

-- Quick setup for first 10 employees (uncomment and adjust IDs as needed):
/*
-- Make first employee CEO
UPDATE employees SET manager_id = NULL, hierarchy_level = 1 WHERE id = 1;

-- Make employees 2-3 senior managers reporting to CEO
UPDATE employees SET manager_id = 1, hierarchy_level = 2 WHERE id IN (2, 3);

-- Make employees 4-5 middle managers reporting to employee 2
UPDATE employees SET manager_id = 2, hierarchy_level = 3 WHERE id IN (4, 5);

-- Make employees 6-10 staff reporting to employee 4
UPDATE employees SET manager_id = 4, hierarchy_level = 4 WHERE id BETWEEN 6 AND 10;
*/

-- Verify the changes
SELECT 
    e.id,
    e.employee_id,
    e.first_name || ' ' || e.last_name as name,
    e.position,
    e.hierarchy_level,
    CASE 
        WHEN e.manager_id IS NULL THEN 'Top Level'
        ELSE (SELECT m.first_name || ' ' || m.last_name FROM employees m WHERE m.id = e.manager_id)
    END as reports_to
FROM employees e
ORDER BY e.hierarchy_level, e.manager_id, e.first_name;
