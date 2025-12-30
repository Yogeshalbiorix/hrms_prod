-- Check table info
PRAGMA table_info(employee_leave_history);

-- Try a dummy insert to see if it fails (using a known existing employee_id, or 1 if unsure)
-- We'll assume employee_id 1 exists for this test, or we can check employees first.
-- Get first employee
CREATE TABLE IF NOT EXISTS temp_emp AS SELECT id FROM employees LIMIT 1;

-- Try Insert
INSERT INTO employee_leave_history 
(employee_id, leave_type, start_date, end_date, total_days, reason, status, duration, is_half_day, half_day_period)
SELECT id, 'sick', '2025-01-01', '2025-01-01', 1, 'Test Leave', 'pending', 1.0, 0, NULL FROM temp_emp;

-- Check result
SELECT * FROM employee_leave_history ORDER BY id DESC LIMIT 1;

-- Cleanup
DELETE FROM employee_leave_history WHERE reason = 'Test Leave';
DROP TABLE temp_emp;
