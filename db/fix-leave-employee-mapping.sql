-- Fix Leave Employee Mapping
-- This script corrects employee_id values in employee_leave_history table
-- where the employee_id was incorrectly set to user.id instead of user.employee_id

-- IMPORTANT: Backup your data before running this script!

-- Step 1: Check for mismatched records (where employee_id doesn't match actual employee)
-- This query shows leave records where the employee_id doesn't match a valid employee
SELECT 
    l.id as leave_id,
    l.employee_id as current_employee_id,
    u.id as user_id,
    u.employee_id as correct_employee_id,
    u.username,
    e.first_name || ' ' || e.last_name as correct_employee_name,
    l.leave_type,
    l.start_date,
    l.end_date,
    l.status
FROM employee_leave_history l
LEFT JOIN users u ON l.employee_id = u.id  -- Where bug happened: employee_id was set to user.id
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.employee_id IS NOT NULL 
  AND l.employee_id != u.employee_id
ORDER BY l.created_at DESC;

-- Step 2: Fix the employee_id values
-- This updates leave records to use the correct employee_id from the users table
UPDATE employee_leave_history
SET employee_id = (
    SELECT u.employee_id 
    FROM users u 
    WHERE u.id = employee_leave_history.employee_id
    AND u.employee_id IS NOT NULL
)
WHERE id IN (
    SELECT l.id
    FROM employee_leave_history l
    INNER JOIN users u ON l.employee_id = u.id
    WHERE u.employee_id IS NOT NULL 
      AND l.employee_id != u.employee_id
);

-- Step 3: Verify the fix
-- This query should return 0 rows if all records are corrected
SELECT 
    l.id,
    l.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.employee_id as employee_code,
    l.leave_type,
    l.start_date,
    l.end_date
FROM employee_leave_history l
INNER JOIN employees e ON l.employee_id = e.id
ORDER BY l.created_at DESC;

-- Step 4: Check for orphaned records (where employee_id doesn't match any employee)
SELECT 
    l.id,
    l.employee_id,
    l.leave_type,
    l.start_date,
    l.end_date,
    l.status,
    'ORPHANED - No matching employee' as issue
FROM employee_leave_history l
LEFT JOIN employees e ON l.employee_id = e.id
WHERE e.id IS NULL;

-- Note: If you have orphaned records, you'll need to manually identify and fix them
-- or delete them if they cannot be recovered:
-- DELETE FROM employee_leave_history WHERE id IN (orphaned_record_ids);
