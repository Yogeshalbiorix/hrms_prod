-- Add rejection_reason column to employee_leave_history table
-- This migration adds support for storing rejection reasons for leave requests

-- Add rejection_reason column
ALTER TABLE employee_leave_history ADD COLUMN rejection_reason TEXT;

-- Update any existing rejected leaves to have a default message if needed
UPDATE employee_leave_history 
SET rejection_reason = notes 
WHERE status = 'rejected' AND rejection_reason IS NULL AND notes IS NOT NULL;
