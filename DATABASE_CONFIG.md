# 🗄️ Database Configuration Guide

This guide will help you configure the Cloudflare D1 database for your HRMS application.

---

## 🚀 Quick Setup (Recommended)

### Option 1: Automated Setup Script

Run the automated setup script:

```bash
bash setup-database.sh
```

This script will:
1. Create the D1 database
2. Initialize the local database with schema and sample data
3. Optionally initialize production database
4. Generate TypeScript types

---

### Option 2: Manual Setup

Follow these steps to manually configure the database:

#### Step 1: Create D1 Database

```bash
wrangler d1 create hrms-database
```

**Output will look like:**
```
✅ Successfully created DB 'hrms-database'

[[d1_databases]]
binding = "DB"
database_name = "hrms-database"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### Step 2: Update wrangler.jsonc

Copy the `database_id` from the output and update `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hrms-database",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // ← Paste your ID here
    }
  ]
}
```

#### Step 3: Initialize Local Database

For development with local database:

```bash
wrangler d1 execute hrms-database --local --file=./db/schema.sql
```

This will:
- Create all tables (departments, employees, attendance, leave, documents)
- Add indexes for performance
- Insert sample data (5 departments, 5 employees)

#### Step 4: Verify Local Setup

```bash
# Check tables were created
wrangler d1 execute hrms-database --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check sample data
wrangler d1 execute hrms-database --local --command="SELECT * FROM employees;"

# Check departments
wrangler d1 execute hrms-database --local --command="SELECT * FROM departments;"
```

#### Step 5: Generate TypeScript Types

```bash
npm run cf-typegen
```

This updates `worker-configuration.d.ts` with proper D1 binding types.

#### Step 6: Initialize Production Database (Optional)

⚠️ **WARNING**: This will reset all production data!

```bash
wrangler d1 execute hrms-database --remote --file=./db/schema.sql
```

---

## 🧪 Testing the Database

### Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:4321`

### Test API Endpoints

```bash
# Get all employees
curl http://localhost:4321/api/employees

# Get all departments
curl http://localhost:4321/api/departments

# Get employee by ID
curl http://localhost:4321/api/employees/1

# Search employees
curl "http://localhost:4321/api/employees?search=sarah"

# Get statistics
curl "http://localhost:4321/api/employees?stats=true"
```

### Test in Browser

Open your browser and navigate to:
- Dashboard: `http://localhost:4321/`
- API endpoints work via fetch in browser console

---

## 📊 Database Schema Overview

### Tables Created

1. **departments** - Company departments
   - 5 sample departments included

2. **employees** - Employee records
   - 5 sample employees included
   - Links to departments via foreign key

3. **employee_attendance** - Daily attendance tracking
   - Sample attendance records included

4. **employee_leave_history** - Leave requests and approvals
   - Sample leave requests included

5. **employee_documents** - Employee document management
   - Ready for file uploads

### Sample Data Included

✅ **Departments:**
- Engineering
- Sales & Marketing
- Human Resources
- Finance
- Operations

✅ **Employees:**
- Sarah Johnson (Engineering, Senior Developer)
- Michael Chen (Sales & Marketing, Sales Manager)
- Emily Rodriguez (HR, HR Specialist)
- David Kim (Finance, Financial Analyst)
- Jessica Brown (Operations, Operations Lead)

---

## 🔧 Useful Database Commands

### Local Database Commands

```bash
# List all databases
wrangler d1 list

# Query local database
wrangler d1 execute hrms-database --local --command="YOUR_SQL_HERE"

# Count employees
wrangler d1 execute hrms-database --local --command="SELECT COUNT(*) as total FROM employees;"

# Get all active employees
wrangler d1 execute hrms-database --local --command="SELECT * FROM employees WHERE status='active';"

# Get employees by department
wrangler d1 execute hrms-database --local --command="
  SELECT e.first_name, e.last_name, d.name as department 
  FROM employees e 
  JOIN departments d ON e.department_id = d.id;
"
```

### Production Database Commands

```bash
# Query production database
wrangler d1 execute hrms-database --remote --command="YOUR_SQL_HERE"

# Backup production data (export)
wrangler d1 export hrms-database --remote --output=backup.sql

# Get production statistics
wrangler d1 execute hrms-database --remote --command="
  SELECT 
    COUNT(*) as total_employees,
    SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
    COUNT(DISTINCT department_id) as departments
  FROM employees;
"
```

---

## 🔍 Troubleshooting

### Issue: Database not found

**Error:**
```
Error: Database not configured in environment
```

**Solution:**
1. Make sure you've created the D1 database: `wrangler d1 list`
2. Check `wrangler.jsonc` has correct `database_id`
3. Restart dev server: `npm run dev`

---

### Issue: Tables don't exist

**Error:**
```
Error: no such table: employees
```

**Solution:**
Run the schema initialization:
```bash
wrangler d1 execute hrms-database --local --file=./db/schema.sql
```

---

### Issue: Type errors with DB binding

**Error:**
```
Property 'DB' does not exist on type 'Env'
```

**Solution:**
Generate TypeScript types:
```bash
npm run cf-typegen
```

This will update `worker-configuration.d.ts` with:
```typescript
interface Env {
  DB: D1Database;
}
```

---

### Issue: Cannot access database in API routes

**Problem:**
Getting undefined when accessing `locals.runtime.env.DB`

**Solution:**
Check your middleware and make sure the database is properly bound. In API routes:

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const db = locals?.runtime?.env?.DB;
  
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }), 
      { status: 500 }
    );
  }
  
  // Use db...
};
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Create production D1 database
- [ ] Update `wrangler.jsonc` with production database_id
- [ ] Initialize production schema: `wrangler d1 execute hrms-database --remote --file=./db/schema.sql`
- [ ] Test API endpoints locally
- [ ] Build: `npm run build`
- [ ] Deploy: `wrangler deploy`
- [ ] Test production endpoints

---

## 📚 Additional Resources

- **Database Schema**: `db/schema.sql`
- **Test Queries**: `db/test-queries.sql`
- **API Documentation**: `DATABASE_SETUP.md`
- **Database Functions**: `src/lib/db.ts`

### Documentation Files

- `DATABASE_SETUP.md` - Complete API documentation
- `DATABASE_CONFIG.md` - This file (setup guide)
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `HRMS_DOCUMENTATION.md` - Full system documentation

---

## 💡 Tips

1. **Local First**: Always test with local database before production
2. **Backup**: Export production data regularly
3. **Migrations**: Use version-controlled SQL files for schema changes
4. **Indexes**: The schema includes optimized indexes for common queries
5. **Soft Deletes**: Employees are soft-deleted by default (status='terminated')

---

## 🎯 Next Steps

After database is configured:

1. ✅ Database configured and running
2. 🔄 Start development: `npm run dev`
3. 🧪 Test API endpoints
4. 💻 Build features using the dashboard
5. 🚀 Deploy to production

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify wrangler is up to date: `npm install -g wrangler@latest`
3. Check Cloudflare D1 status: https://www.cloudflarestatus.com/
4. Review logs: `wrangler tail`

---

**Configuration Status**: Ready to Configure ⚡
**Last Updated**: January 2024
**Version**: 1.0.0
