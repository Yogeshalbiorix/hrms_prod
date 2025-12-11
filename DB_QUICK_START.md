# 🚀 Database Quick Start Guide

Get your HRMS database up and running in 5 minutes!

---

## ⚡ Super Quick Setup

### 1. Run the setup script

```bash
npm run db:setup
```

This automated script will guide you through:
- Creating the D1 database
- Initializing schema with sample data
- Generating TypeScript types

---

## 📋 Manual Setup (3 Commands)

If you prefer manual control:

### 1. Create Database
```bash
npm run db:create
```

### 2. Copy Database ID
Copy the `database_id` from output and update `wrangler.jsonc`:
```jsonc
"database_id": "paste-your-id-here"
```

### 3. Initialize Database
```bash
npm run db:init:local
```

---

## ✅ Verify Setup

### Check tables were created:
```bash
npm run db:query:local "SELECT name FROM sqlite_master WHERE type='table';"
```

### Check sample data:
```bash
npm run db:query:local "SELECT * FROM employees;"
```

---

## 🎯 Start Developing

```bash
npm run dev
```

Visit `http://localhost:4321` and your HRMS dashboard should be live with sample data!

---

## 🧪 Test API Endpoints

```bash
# Get all employees
curl http://localhost:4321/api/employees

# Get all departments  
curl http://localhost:4321/api/departments

# Get employee by ID
curl http://localhost:4321/api/employees/1

# Search employees
curl "http://localhost:4321/api/employees?search=sarah"
```

---

## 📚 Need More Details?

- **Complete Setup Guide**: `DATABASE_CONFIG.md`
- **API Documentation**: `DATABASE_SETUP.md`
- **Schema Details**: `db/schema.sql`

---

## 🎉 Sample Data Included

Your database comes pre-loaded with:

- ✅ **5 Departments**: Engineering, Sales, HR, Finance, Operations
- ✅ **5 Employees**: Complete with realistic data
- ✅ **Attendance Records**: Sample attendance tracking
- ✅ **Leave Requests**: Sample leave management data

All ready for testing and development!

---

## 🔧 Useful NPM Scripts

```bash
npm run db:setup         # Automated setup
npm run db:create        # Create database
npm run db:init:local    # Initialize local DB
npm run db:init:remote   # Initialize production DB
npm run db:list          # List all databases
npm run db:info          # Get database info
npm run cf-typegen       # Generate TypeScript types
```

---

## ⚠️ Common Issues

### Database not found?
Make sure you've run `npm run db:init:local` after creating the database.

### Type errors?
Run `npm run cf-typegen` to generate TypeScript types.

### API not working?
Check the database is initialized and dev server is running.

---

**Ready?** Run `npm run db:setup` and get started! 🚀
