-- Safe hierarchy migration - just adds columns without setting values
-- This avoids foreign key constraint violations

-- ALTER TABLE employees ADD COLUMN manager_id INTEGER;

-- ALTER TABLE employees ADD COLUMN hierarchy_level INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_hierarchy_level ON employees(hierarchy_level);

-- Note: manager_id values will be set through the UI or Team Assignment feature
-- This ensures no foreign key constraint violations
