# Data Fix Guide: Leave Employee Mapping

## Problem
Leave requests were being created with `user.id` (user account ID) instead of `user.employee_id` (employee table FK), causing leave records to show incorrect employee information in the admin panel.

## What Was Fixed in the Code

### UserDashboard.tsx - Line 138
**Before:**
```typescript
const response = await fetch(`/api/leaves?employee_id=${user?.id}`, {
```

**After:**
```typescript
const response = await fetch(`/api/leaves?employee_id=${user?.employee_id}`, {
```

### UserDashboard.tsx - Line 184
**Before:**
```typescript
employee_id: user?.id,
```

**After:**
```typescript
employee_id: user?.employee_id,
```

## Fixing Existing Data

### Option 1: Using npx wrangler d1 (Recommended for Production)

1. **Test the fix query first (dry run):**
```bash
npx wrangler d1 execute hrms_db --remote --command "SELECT l.id as leave_id, l.employee_id as current_employee_id, u.id as user_id, u.employee_id as correct_employee_id, u.username FROM employee_leave_history l LEFT JOIN users u ON l.employee_id = u.id WHERE u.employee_id IS NOT NULL AND l.employee_id != u.employee_id;"
```

2. **Apply the fix:**
```bash
npx wrangler d1 execute hrms_db --remote --file=db/fix-leave-employee-mapping.sql
```

### Option 2: Using Cloudflare Dashboard

1. Go to your Cloudflare Dashboard
2. Navigate to Workers & Pages → D1 Databases
3. Select your `hrms_db` database
4. Open the Console tab
5. Copy and paste the SQL from `db/fix-leave-employee-mapping.sql`
6. Run each section one by one

### Option 3: Local Development

If using local dev mode:
```bash
npx wrangler d1 execute hrms_db --local --file=db/fix-leave-employee-mapping.sql
```

## Verification Steps

After running the fix:

1. **Check leave records in admin panel:**
   - Go to Admin Panel → Leave Management
   - Verify that employee names, codes, and departments are correct
   - Check that leave requests match the actual employees who requested them

2. **Test new leave requests:**
   - Login as a user
   - Create a new leave request
   - Go to admin panel and verify it shows the correct employee information

3. **Run verification query:**
```sql
SELECT 
    l.id,
    e.employee_id as emp_code,
    e.first_name || ' ' || e.last_name as employee_name,
    e.department,
    l.leave_type,
    l.start_date,
    l.end_date,
    l.status
FROM employee_leave_history l
INNER JOIN employees e ON l.employee_id = e.id
ORDER BY l.created_at DESC
LIMIT 10;
```

## Understanding the Fix

### Database Schema
```
users table:
- id (PK) ← This was incorrectly being used
- employee_id (FK to employees.id) ← This should be used

employees table:
- id (PK)
- employee_id (unique code like "EMP007")

employee_leave_history table:
- id (PK)
- employee_id (FK to employees.id) ← Must match employees.id, not users.id
```

### Example of the Bug
```
User: { id: 1, employee_id: 7, username: "pushpak" }
Employee: { id: 7, employee_id: "EMP007", first_name: "Pushpak" }

❌ WRONG (before fix):
Leave created with employee_id = 1 (user.id)
JOIN fails: employee_leave_history.employee_id(1) → employees.id(1) → Shows wrong employee

✅ CORRECT (after fix):
Leave created with employee_id = 7 (user.employee_id)
JOIN works: employee_leave_history.employee_id(7) → employees.id(7) → Shows correct employee (Pushpak)
```

## Prevention

The code fix ensures that all future leave requests will use the correct employee_id. The changes have been applied to:

- Leave request creation (handleLeaveSubmit)
- Leave request fetching (fetchLeaveRequests)

## Need Help?

If you encounter issues:

1. **Backup first:** Export your D1 database before running any updates
2. **Test locally:** Use `--local` flag to test on local database first
3. **Check logs:** Look for any error messages in the Cloudflare dashboard
4. **Manual verification:** Check a few leave records manually to confirm the fix worked

## Quick Commands Reference

```bash
# Check current state
npx wrangler d1 execute hrms_db --remote --command "SELECT COUNT(*) as total_leaves FROM employee_leave_history"

# Apply fix
npx wrangler d1 execute hrms_db --remote --file=db/fix-leave-employee-mapping.sql

# Verify fix
npx wrangler d1 execute hrms_db --remote --command "SELECT l.id, e.employee_id, e.first_name, l.leave_type FROM employee_leave_history l JOIN employees e ON l.employee_id = e.id LIMIT 5"
```

## Summary

✅ **Fixed in code:**
- UserDashboard.tsx leave submission now uses correct employee_id
- UserDashboard.tsx leave fetching now uses correct employee_id

🔧 **Action needed:**
- Run the SQL migration to fix existing corrupted data
- Verify leave records show correct employee information
- Test creating new leave requests

🎯 **Expected result:**
- All leave requests now display the correct employee name, code, and department
- User activity tracking shows accurate information
- No more "wrong information" in the leave management panel
