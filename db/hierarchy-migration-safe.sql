-- Safe hierarchy migration - just adds columns without setting values
-- This avoids foreign key constraint violations

-- Add manager_id column (references employees.id for reporting structure)
ALTER TABLE employees ADD COLUMN manager_id INTEGER;

-- Add hierarchy_level column (1 = CEO, 2 = Senior Management, 3 = Middle Management, etc.)
ALTER TABLE employees ADD COLUMN hierarchy_level INTEGER DEFAULT 5;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_hierarchy_level ON employees(hierarchy_level);

-- Note: manager_id values will be set through the UI or Team Assignment feature
-- This ensures no foreign key constraint violations
