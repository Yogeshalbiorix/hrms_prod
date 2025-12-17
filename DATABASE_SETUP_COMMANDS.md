# 🗄️ Database Setup Commands

## 🚀 Quick Setup - Create All Tables in Live Database

### Option 1: Automated Script (Recommended)
```bash
npm run db:setup:live
```

This runs the PowerShell script that:
- ✅ Checks wrangler installation
- ✅ Verifies database exists
- ✅ Executes all schema files in order
- ✅ Verifies tables were created
- ✅ Checks admin user exists
- ✅ Shows detailed progress

### Option 2: Single Command (All schemas)
```bash
npm run db:init:remote:all
```

### Option 3: Manual Step-by-Step
```bash
# 1. Main schema (employees, departments, etc.)
wrangler d1 execute hrms-database --remote --file=./db/schema.sql

# 2. Authentication tables (users, sessions)
wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql

# 3. Payroll tables
wrangler d1 execute hrms-database --remote --file=./db/payroll-schema.sql

# 4. Recruitment tables
wrangler d1 execute hrms-database --remote --file=./db/recruitment-schema.sql

# 5. Activity requests
wrangler d1 execute hrms-database --remote --file=./db/activity-requests-schema.sql

# 6. User auth enhancements
wrangler d1 execute hrms-database --remote --file=./db/user-auth-enhancements.sql

# 7. Create admin users
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql

# 8. Organization hierarchy
wrangler d1 execute hrms-database --remote --file=./db/hierarchy-migration-safe.sql
```

---

## ✅ Verify Setup

### Check if tables were created
```bash
npm run db:verify
```

Or manually:
```bash
wrangler d1 execute hrms-database --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Check admin users
```bash
wrangler d1 execute hrms-database --remote --command="SELECT username, email, role FROM users WHERE role='admin';"
```

### Check employee count
```bash
wrangler d1 execute hrms-database --remote --command="SELECT COUNT(*) as total FROM employees;"
```

---

## 🔄 Reset Database (Start Fresh)

### ⚠️ WARNING: This deletes all data!

```bash
# Drop all tables (careful!)
wrangler d1 execute hrms-database --remote --command="DROP TABLE IF EXISTS employees; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS departments; DROP TABLE IF EXISTS attendance; DROP TABLE IF EXISTS leave_requests; DROP TABLE IF EXISTS payroll; DROP TABLE IF EXISTS recruitment_jobs; DROP TABLE IF EXISTS activity_requests; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS password_reset_tokens; DROP TABLE IF EXISTS user_permissions; DROP TABLE IF EXISTS user_audit_log; DROP TABLE IF EXISTS organization_hierarchy;"

# Then re-run setup
npm run db:setup:live
```

---

## 🐛 Troubleshooting

### Problem: "Database not found"
```bash
# Create the database
wrangler d1 create hrms-database

# Copy the database_id from output and update wrangler.jsonc
```

### Problem: "Table already exists"
This is normal if you run setup twice. The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe.

### Problem: "No admin user found"
```bash
# Re-create admin users
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql

# Verify
wrangler d1 execute hrms-database --remote --command="SELECT * FROM users WHERE role='admin';"
```

### Problem: "Wrangler not found"
```bash
# Install wrangler globally
npm install -g wrangler

# Or use npx
npx wrangler d1 list
```

---

## 📊 Database Info

### Get database info
```bash
npm run db:info
```

### List all databases
```bash
npm run db:list
```

### Execute custom query
```bash
# Get all departments
wrangler d1 execute hrms-database --remote --command="SELECT * FROM departments;"

# Get employee count by department
wrangler d1 execute hrms-database --remote --command="SELECT d.name, COUNT(e.id) as employee_count FROM departments d LEFT JOIN employees e ON d.id = e.department_id GROUP BY d.id;"
```

---

## 📋 All Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup:live` | 🚀 **Setup all tables (recommended)** |
| `npm run db:init:remote:all` | Create all tables (one command) |
| `npm run db:verify` | Check what tables exist |
| `npm run db:create` | Create new database |
| `npm run db:list` | List all databases |
| `npm run db:info` | Get database details |
| `npm run db:query:remote` | Execute custom query |

---

## 🎯 Complete Setup Flow

```bash
# 1. Make sure you're logged in
wrangler login

# 2. Create database (if needed)
wrangler d1 create hrms-database

# 3. Update wrangler.jsonc with database_id

# 4. Setup all tables
npm run db:setup:live

# 5. Verify setup
npm run db:verify

# 6. Build and deploy
npm run build
wrangler pages deploy dist

# 7. Test your app
# Login: admin / admin123
```

---

## 💡 Quick Tips

1. **Always verify after setup:** Run `npm run db:verify` to confirm tables exist
2. **Safe to re-run:** All scripts use `IF NOT EXISTS`, so safe to run multiple times
3. **Local testing:** Replace `--remote` with `--local` for local database
4. **Backup before reset:** Use wrangler to export data before dropping tables
5. **Check logs:** If errors occur, check Cloudflare dashboard for details

---

## 📝 Table Structure

After setup, you'll have these tables:

**Core Tables:**
- `employees` - Employee records
- `departments` - Department information
- `users` - User accounts for login
- `sessions` - Active user sessions

**HR Features:**
- `attendance` - Daily attendance records
- `leave_requests` - Leave applications
- `payroll` - Salary and payment records
- `organization_hierarchy` - Org structure

**Recruitment:**
- `recruitment_jobs` - Job postings
- `job_applications` - Candidate applications

**System:**
- `activity_requests` - Activity tracking
- `password_reset_tokens` - Password resets
- `user_permissions` - User access control
- `user_audit_log` - Audit trail

---

## 🔐 Default Admin Credentials

After setup, login with:
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Change this password immediately in production!**

---

**Need help? Check the Cloudflare D1 docs:** https://developers.cloudflare.com/d1/
