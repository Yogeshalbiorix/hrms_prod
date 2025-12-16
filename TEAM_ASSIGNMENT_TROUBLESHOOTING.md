# Team Assignment Troubleshooting Guide

## Error: "0 assignments successful, X failed"

This error means the API calls to update employee manager assignments are failing. Here's how to diagnose and fix it:

## 🔍 Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to the **Console** tab
3. Try to assign a team again
4. Look for error messages that show:
   - HTTP status codes (500, 404, 400, etc.)
   - Error messages from the API
   - Response bodies

### What to Look For:

#### Error: "Database not configured"
**Solution:** The database binding is not available in the runtime
```bash
# Make sure you're running with wrangler dev
npm run dev
# or
wrangler dev
```

#### Error: "Employee not found"
**Solution:** The employee ID doesn't exist in the database
- Check the employee IDs in the console logs
- Verify employees exist: Run `SELECT * FROM employees;`

#### Error: "Failed to update employee"
**Solution:** The database update query failed
- Check if `manager_id` column exists
- Run the hierarchy migration

## 🗄️ Step 2: Verify Database Schema

Check if the `manager_id` column exists:

```sql
-- Check table structure
PRAGMA table_info(employees);
```

You should see a row with:
- `name`: `manager_id`
- `type`: `INTEGER`

### If Column is Missing:

Run the migration:
```bash
# For local development
wrangler d1 execute hrms-database --local --file=./db/hierarchy-migration.sql

# For production
wrangler d1 execute hrms-database --remote --file=./db/hierarchy-migration.sql
```

## 🔧 Step 3: Test API Directly

Test if the API endpoint works using curl or browser fetch:

```javascript
// Open browser console and run this:
const sessionToken = localStorage.getItem('sessionToken');
const testEmployeeId = 1; // Replace with actual employee ID
const testManagerId = 2;  // Replace with actual manager ID

fetch(`/api/employees/${testEmployeeId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    manager_id: testManagerId
  })
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

### Expected Success Response:
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": { ... employee object ... }
}
```

### Common Error Responses:

#### HTTP 500 - Database not configured
```json
{
  "error": "Database not configured"
}
```
**Fix:** Make sure you're running with `wrangler dev` or the database binding is set up

#### HTTP 404 - Employee not found
```json
{
  "success": false,
  "error": "Employee not found"
}
```
**Fix:** Check the employee ID exists in the database

#### HTTP 500 - Update failed
```json
{
  "success": false,
  "error": "Failed to update employee"
}
```
**Fix:** Check database schema and column existence

## 🏃 Step 4: Check if Running Correctly

Ensure you're running the development server correctly:

```bash
# Stop any running instances
# Then start fresh:
npm run dev
```

Check that you see:
- ✅ Wrangler is running
- ✅ Database binding is available
- ✅ Server is on http://localhost:4321

## 📊 Step 5: Verify Data

Check your database has employees:

```sql
-- List all employees
SELECT id, employee_id, first_name, last_name, manager_id, hierarchy_level 
FROM employees;

-- Check for existing hierarchy relationships
SELECT 
  e.first_name || ' ' || e.last_name as employee,
  m.first_name || ' ' || m.last_name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
WHERE e.manager_id IS NOT NULL;
```

## 🔄 Step 6: Apply the Fix

Based on the console errors, apply the appropriate fix:

### Fix 1: Run Database Migration
```bash
cd db
wrangler d1 execute hrms-database --local --file=hierarchy-migration.sql
```

### Fix 2: Verify DB Binding
Check `wrangler.jsonc` has:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hrms-database",
      "database_id": "your-database-id"
    }
  ]
}
```

### Fix 3: Restart Development Server
```bash
# Kill all node processes
npx kill-port 4321
npx kill-port 3000

# Restart
npm run dev
```

## 📝 Step 7: Test Again

1. Go to Dashboard → Assign Team
2. Select a manager
3. Click "Assign Team Members"
4. Move some employees to the right
5. Click "Save Assignments"
6. Check console for detailed logs

### Expected Console Output (Success):
```
Saving team assignments:
- Manager ID: 2
- To Add: 3 employees
- To Remove: 0 employees
Adding employee 5 to manager 2
Response status: 200 OK
Response body: {success: true, message: "Employee updated successfully", ...}
✓ Employee 5 assigned successfully
Adding employee 6 to manager 2
Response status: 200 OK
✓ Employee 6 assigned successfully
...
Team assignment complete: 3 success, 0 errors
```

## 🐛 Common Issues and Solutions

### Issue 1: HTTP 500 - Database not configured
**Cause:** Running without wrangler or DB binding not set up
**Solution:** 
- Use `npm run dev` (which runs wrangler dev)
- Don't use `astro dev` directly

### Issue 2: Manager ID Not Saving
**Cause:** `manager_id` column doesn't exist
**Solution:**
```bash
wrangler d1 execute hrms-database --local --file=./db/hierarchy-migration.sql
```

### Issue 3: Circular Reference Error
**Cause:** Trying to make A report to B when B reports to A
**Solution:** This is expected behavior - reorganize the hierarchy first

### Issue 4: Authorization Failed
**Cause:** Session token expired or invalid
**Solution:** Log out and log back in

### Issue 5: Employee Not Found
**Cause:** Employee ID doesn't exist in database
**Solution:** Verify employee exists with `SELECT * FROM employees WHERE id = X;`

## 📞 Still Having Issues?

If none of the above solutions work:

1. **Export Console Logs:**
   - Right-click in console → Save as...
   - Share the logs for debugging

2. **Check Database State:**
   ```sql
   -- Run this and share the output
   PRAGMA table_info(employees);
   SELECT COUNT(*) as total_employees FROM employees;
   SELECT COUNT(*) as employees_with_managers FROM employees WHERE manager_id IS NOT NULL;
   ```

3. **Verify API Endpoint:**
   - Check if `/api/employees/[id]` endpoint exists
   - Check `src/pages/api/employees/[id].ts` file

4. **Check Database Connection:**
   ```javascript
   // In browser console
   fetch('/api/employees')
     .then(r => r.json())
     .then(d => console.log('Employees:', d));
   ```

## ✅ Success Checklist

- [ ] Running with `npm run dev` (wrangler)
- [ ] Database migration applied
- [ ] `manager_id` column exists in employees table
- [ ] Employees exist in database
- [ ] Can fetch employees from API
- [ ] Console shows detailed error messages
- [ ] Session token is valid

## 🎯 Quick Test

Run this in browser console to test everything:
```javascript
console.log('=== Team Assignment Test ===');
console.log('1. Session Token:', localStorage.getItem('sessionToken') ? 'EXISTS' : 'MISSING');

fetch('/api/employees')
  .then(r => r.json())
  .then(d => {
    console.log('2. API Reachable:', d.success ? 'YES' : 'NO');
    console.log('3. Employee Count:', d.data?.length || 0);
    if (d.data && d.data.length > 0) {
      console.log('4. Sample Employee:', d.data[0]);
      console.log('5. Has manager_id field:', 'manager_id' in d.data[0] ? 'YES' : 'NO');
    }
  })
  .catch(e => console.error('API Error:', e));
```

Expected output:
```
=== Team Assignment Test ===
1. Session Token: EXISTS
2. API Reachable: YES
3. Employee Count: 6
4. Sample Employee: {id: 1, first_name: "Keval", manager_id: null, ...}
5. Has manager_id field: YES
```
