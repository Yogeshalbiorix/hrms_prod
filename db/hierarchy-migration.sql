-- Add hierarchy fields to employees table
-- This migration adds manager_id and hierarchy_level columns to support organizational hierarchy

-- Add manager_id column (references employees.id for reporting structure)
ALTER TABLE employees ADD COLUMN manager_id INTEGER;

-- Add hierarchy_level column (1 = CEO, 2 = Senior Management, 3 = Middle Management, etc.)
ALTER TABLE employees ADD COLUMN hierarchy_level INTEGER DEFAULT 5;

-- Add foreign key constraint
-- Note: SQLite doesn't support adding foreign keys to existing tables directly
-- So we'll need to recreate the table if strict foreign key is needed

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_hierarchy_level ON employees(hierarchy_level);

-- Update existing employees to set default hierarchy level based on position
UPDATE employees 
SET hierarchy_level = CASE
  WHEN LOWER(position) LIKE '%ceo%' OR LOWER(position) LIKE '%chief%' OR LOWER(position) LIKE '%director%' THEN 1
  WHEN LOWER(position) LIKE '%vp%' OR LOWER(position) LIKE '%vice president%' OR LOWER(position) LIKE '%head%' THEN 2
  WHEN LOWER(position) LIKE '%manager%' OR LOWER(position) LIKE '%lead%' THEN 3
  WHEN LOWER(position) LIKE '%senior%' OR LOWER(position) LIKE '%sr%' THEN 4
  ELSE 5
END
WHERE hierarchy_level IS NULL OR hierarchy_level = 5;
