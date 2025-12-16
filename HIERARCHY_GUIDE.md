# Organization Hierarchy Guide

## Overview
The HRMS now includes a complete organizational hierarchy system that allows admins to manage reporting structures and enables employees to view their teams.

## Features Added

### 1. Organization Hierarchy (Admin Only)
- **Location**: Dashboard → Hierarchy tab
- **Purpose**: Manage complete organizational structure
- **Features**:
  - Visual organization tree showing reporting relationships
  - Edit reporting structure (assign managers)
  - Set hierarchy levels (1-5)
  - View statistics (total employees, managers, hierarchy depth)
  - Drag-and-drop style hierarchy visualization

### 2. My Team (All Users)
- **Location**: Dashboard → My Team tab
- **Purpose**: View direct reports and team status
- **Features**:
  - See all employees who report to you
  - Real-time attendance status of team members
  - Team statistics (active, present, absent)
  - Team member contact information
  - Activity indicators (green = active, gray = offline)

### 3. Organization Directory (Enhanced)
- **Location**: Dashboard → Organization tab
- **Purpose**: Browse all employees with live status
- **Features**:
  - Employee cards with photos and details
  - Real-time activity status (green dot = clocked in, red dot = clocked out)
  - Search and filter capabilities
  - Click to view detailed employee information
  - Attendance and leave history in drawer

## Database Schema

### New Columns Added to `employees` Table:
```sql
manager_id INTEGER         -- References employees.id (who this person reports to)
hierarchy_level INTEGER    -- 1=Executive, 2=Senior Mgmt, 3=Middle Mgmt, 4=Staff, 5=Junior
```

### Hierarchy Levels:
- **Level 1**: Executive (CEO, Directors, C-Suite)
- **Level 2**: Senior Management (VPs, Department Heads)
- **Level 3**: Middle Management (Managers, Team Leaders)
- **Level 4**: Staff (Senior Developers, Specialists)
- **Level 5**: Junior Staff (Junior Developers, Associates)

## Setup Instructions

### Step 1: Run Database Migration
```bash
# Connect to your database and run:
npx wrangler d1 execute hrms_database --file=./db/hierarchy-migration.sql --local
```

Or for production:
```bash
npx wrangler d1 execute hrms_database --file=./db/hierarchy-migration.sql --remote
```

### Step 2: Assign Managers
1. Go to Dashboard → **Hierarchy** tab (admin only)
2. Click **Edit** button next to any employee
3. Select their manager from dropdown
4. Set their hierarchy level
5. Click **Update**

### Step 3: Build Organization Structure
Start from the top:
1. Identify your CEO/top executive (leave manager_id empty)
2. Assign department heads to report to CEO
3. Assign managers to report to department heads
4. Assign team members to report to managers
5. Continue building the tree structure

## Usage Examples

### Example 1: Setting Up a Development Team
```
CEO (Level 1)
└── CTO (Level 2, reports to CEO)
    └── Engineering Manager (Level 3, reports to CTO)
        ├── Team Lead - Frontend (Level 4, reports to Eng. Manager)
        │   ├── Senior Developer (Level 4)
        │   └── Junior Developer (Level 5)
        └── Team Lead - Backend (Level 4, reports to Eng. Manager)
            ├── Senior Developer (Level 4)
            └── Junior Developer (Level 5)
```

### Example 2: Setting Up a Sales Team
```
CEO (Level 1)
└── Sales Director (Level 2, reports to CEO)
    ├── Sales Manager - North (Level 3)
    │   ├── Sales Executive (Level 4)
    │   └── Sales Executive (Level 4)
    └── Sales Manager - South (Level 3)
        ├── Sales Executive (Level 4)
        └── Sales Executive (Level 4)
```

## User Permissions

### Admin Users Can:
- ✅ View complete organization hierarchy
- ✅ Edit reporting relationships
- ✅ Assign managers to employees
- ✅ Set hierarchy levels
- ✅ View all teams
- ✅ Edit attendance records

### Regular Users Can:
- ✅ View their own team members (My Team tab)
- ✅ See organization directory with live status
- ✅ View their position in the hierarchy
- ❌ Cannot edit hierarchy structure
- ❌ Cannot see teams they don't manage

## API Endpoints

### Get Employees with Hierarchy
```
GET /api/employees
Returns: All employees with manager_id and hierarchy_level fields
```

### Update Employee Hierarchy
```
PUT /api/employees/{id}
Body: {
  "manager_id": 5,
  "hierarchy_level": 3
}
```

## Activity Status Features

### Real-time Status Indicators:
- **Green Dot/Badge**: Employee has clocked in today and hasn't clocked out
- **Red Dot/Badge**: Employee hasn't clocked in or has already clocked out
- **ACTIVE Tag**: Currently working (clocked in)
- **INACTIVE/OFFLINE Tag**: Not currently working

### Auto-refresh:
- Attendance status refreshes every 30 seconds automatically
- No manual refresh needed
- Works in Organization Directory and My Team views

## Troubleshooting

### Issue: Hierarchy tree not showing
**Solution**: Ensure at least one employee has no manager_id (top-level executive)

### Issue: Can't see team members
**Solution**: Check that employees have manager_id pointing to your employee ID

### Issue: Activity status not updating
**Solution**: 
1. Check if employees are clocking in/out properly
2. Verify today's attendance records exist
3. Wait 30 seconds for auto-refresh

### Issue: Circular reporting (A reports to B, B reports to A)
**Solution**: The system prevents this when editing. If it exists:
1. Set one employee's manager_id to NULL temporarily
2. Fix the other employee's reporting
3. Set correct reporting for both

## Best Practices

1. **Start from the Top**: Always set up CEO/executives first
2. **One Manager Per Person**: Each employee should report to only one manager
3. **Consistent Levels**: Keep hierarchy levels consistent across departments
4. **Regular Updates**: Update reporting structure when employees change roles
5. **Clear Naming**: Use clear, consistent position titles

## Future Enhancements

Planned features:
- Drag-and-drop hierarchy reorganization
- Bulk hierarchy updates
- Hierarchy change history/audit log
- Approval workflows for hierarchy changes
- Export organization chart as PDF/image
- Department-specific hierarchy views

## Support

For issues or questions:
1. Check console logs for errors
2. Verify database migration completed successfully
3. Ensure all employees have valid manager_id references
4. Contact system administrator

---

**Note**: After running the migration, the system will automatically assign hierarchy levels based on position titles. You can manually adjust these levels as needed through the Hierarchy tab.
