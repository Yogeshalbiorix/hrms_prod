# Organization Hierarchy Setup Guide

## Overview
The HRMS now includes a complete organizational hierarchy system with:
- Visual org chart showing reporting relationships
- Team assignment interface for managers
- Employee hierarchy management
- Real-time activity status tracking

## Database Setup

### 1. Apply Hierarchy Migration
Run the migration to add hierarchy columns to the employees table:

```sql
-- Run this file
db/hierarchy-migration.sql
```

This adds:
- `manager_id` - References the employee's direct manager
- `hierarchy_level` - 1 (Executive) to 5 (Junior Staff)

### 2. Verify Setup
Check if the migration was successful:

```sql
-- Run this file
db/verify-hierarchy.sql
```

This will show:
- Table structure with new columns
- Current employees and their hierarchy
- Employees by level
- Reporting relationships

### 3. Set Up Sample Data (Optional)
For testing, set up a sample hierarchy:

```sql
-- Edit and run this file
db/setup-sample-hierarchy.sql
```

## Features

### 1. Organization Hierarchy View
**Location:** Dashboard → Hierarchy

**Features:**
- **Visual org chart** with employee cards and connecting lines
- **Real-time status** - Green dot = clocked in, Red/Gray = clocked out
- **View modes:**
  - "Top of the Org" - Shows complete hierarchy from CEO down
  - "My Team" - Shows your team and direct reports
- **Search** - Filter employees by name, position, or email
- **Group by Department** - Organize view by departments
- **Edit hierarchy** - Click "Edit" on any employee card

**Stats displayed:**
- Total employees
- Number of managers
- Hierarchy depth (levels)

### 2. Team Assignment
**Location:** Dashboard → Assign Team

**Features:**
- Select a manager from dropdown
- View current team members
- Use Transfer component to assign/unassign employees
- Bulk operations support
- Real-time updates

**How to assign:**
1. Select a manager from the dropdown
2. Click "Assign Team Members"
3. Move employees to the right panel to assign them
4. Click "Save Assignments"

### 3. My Team View
**Location:** Dashboard → My Team

**Features:**
- Shows direct reports for logged-in user
- Team statistics (active, present, absent)
- Real-time attendance status
- Contact information for team members

## Setting Up Hierarchy

### Method 1: Using Organization Hierarchy Page
1. Go to Dashboard → Hierarchy
2. Click "Edit" on any employee card
3. Set:
   - **Reports To** - Select their manager
   - **Position** - Job title
   - **Hierarchy Level** - 1-5 (1=CEO, 5=Junior)
4. Click "Update"

### Method 2: Using Team Assignment
1. Go to Dashboard → Assign Team
2. Select a manager from dropdown
3. Click "Assign Team Members"
4. Select employees to assign
5. Click "Save Assignments"

### Method 3: Direct Database Update
```sql
-- Set reporting relationship
UPDATE employees 
SET manager_id = [manager_employee_id], 
    hierarchy_level = [1-5]
WHERE id = [employee_id];
```

## Hierarchy Levels

| Level | Role | Examples |
|-------|------|----------|
| 1 | Executive | CEO, Directors, C-Suite |
| 2 | Senior Management | VP, Department Heads |
| 3 | Middle Management | Managers, Team Leads |
| 4 | Staff | Senior Developers, Analysts |
| 5 | Junior Staff | Junior Developers, Interns |

## Best Practices

### 1. Start from Top
- Define CEO/Executive first (Level 1, no manager)
- Add senior management (Level 2, reports to CEO)
- Continue down the hierarchy

### 2. Maintain Consistency
- Each employee should have exactly one manager (except CEO)
- Hierarchy levels should match actual reporting structure
- Avoid circular reporting (A reports to B, B reports to A)

### 3. Use Bulk Operations
- Use Team Assignment for bulk changes
- More efficient than editing individual employees

### 4. Regular Updates
- Update when employees change roles
- Update when organizational structure changes
- Keep hierarchy levels consistent with positions

## Troubleshooting

### No Employees Show in Hierarchy
**Problem:** Organization chart is empty

**Solutions:**
1. Check if employees exist: Go to Organization Directory
2. Verify hierarchy columns exist: Run `db/verify-hierarchy.sql`
3. Assign at least one top-level employee (manager_id = NULL)
4. Check browser console for errors

### Can't Assign Teams
**Problem:** Team assignment not working

**Solutions:**
1. Ensure manager_id field is in database
2. Check if updateEmployee API supports manager_id
3. Verify employee IDs are correct
4. Check browser console for API errors

### Circular Reporting
**Problem:** A reports to B, B reports to A

**Solutions:**
1. Review reporting structure
2. Use verify-hierarchy.sql to find circular references
3. Update one relationship to break the circle

### Missing Hierarchy Data
**Problem:** Some employees don't appear in hierarchy

**Solutions:**
1. Check if manager_id is set
2. Verify manager exists in employees table
3. Check if employee is filtered out by search
4. Try "Top of the Org" view to see all employees

## API Endpoints

### Get Employees
```
GET /api/employees
```
Returns all employees with hierarchy information.

### Update Employee Hierarchy
```
PUT /api/employees/:id
Body: {
  "manager_id": number | null,
  "hierarchy_level": 1-5
}
```

### Get Current User
```
GET /api/auth/profile
```
Returns current user's employee data for "My Team" view.

## Database Schema

```sql
CREATE TABLE employees (
    -- ... existing fields ...
    manager_id INTEGER,
    hierarchy_level INTEGER DEFAULT 5,
    -- ... other fields ...
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);

-- Indexes for performance
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_hierarchy_level ON employees(hierarchy_level);
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Hierarchy columns exist in employees table
- [ ] At least one top-level employee (manager_id = NULL)
- [ ] Organization Hierarchy page loads without errors
- [ ] Can edit employee hierarchy relationships
- [ ] Team Assignment page works
- [ ] Can assign/unassign employees to managers
- [ ] My Team page shows current user's team
- [ ] Real-time status dots display correctly
- [ ] Search and filters work
- [ ] View mode switching works
- [ ] Group by department works

## Next Steps

1. **Apply Migration:** Run `db/hierarchy-migration.sql` on your database
2. **Verify Setup:** Check with `db/verify-hierarchy.sql`
3. **Configure Hierarchy:** Use Organization Hierarchy or Team Assignment
4. **Test Features:** Try all view modes and filters
5. **Train Users:** Show managers how to use My Team and Assign Team

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check network tab for API failures
3. Run verify-hierarchy.sql to check database state
4. Review this guide's troubleshooting section
