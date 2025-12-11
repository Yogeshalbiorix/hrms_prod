# 🗄️ HRMS Database - Complete Guide

Welcome to the HRMS Database setup guide! This README will help you get started quickly.

---

## 🚀 Quick Start (60 seconds)

```bash
# 1. Run automated setup
npm run db:setup

# 2. Start development
npm run dev

# 3. Open browser
open http://localhost:4321
```

**That's it!** Your HRMS database is ready with sample data.

---

## 📋 What You Get

### ✅ Database Schema
- **5 tables**: departments, employees, attendance, leave, documents
- **Optimized indexes** for fast queries
- **Sample data**: 5 departments, 5 employees, attendance, leave records

### ✅ API Endpoints
- `GET/POST /api/employees` - Employee management
- `GET/PUT/DELETE /api/employees/:id` - Single employee operations
- `GET/POST /api/departments` - Department management

### ✅ Database Functions
- Full CRUD operations for employees
- Search and filtering
- Statistics and reporting
- TypeScript typed

### ✅ Complete Documentation
- Quick start guides
- API reference
- Configuration details
- Troubleshooting help

---

## 📖 Documentation Files

| File | Purpose | When to Read |
|------|---------|--------------|
| **DB_QUICK_START.md** | 5-minute quick start | Start here! |
| **SETUP_CHECKLIST.md** | Step-by-step checklist | Track your progress |
| **DATABASE_CONFIG.md** | Detailed configuration | Need more details |
| **DATABASE_SETUP.md** | Complete API docs | Building features |
| **DATABASE_STATUS.md** | Current status | Check what's done |
| **DB_SETUP_SUMMARY.txt** | Visual overview | Quick reference |

---

## 🛠️ NPM Scripts

### Setup Scripts
```bash
npm run db:setup          # Complete automated setup (use this!)
npm run db:create         # Create D1 database
npm run db:init:local     # Initialize local database
npm run db:init:remote    # Initialize production database
```

### Management Scripts
```bash
npm run db:list           # List all databases
npm run db:info           # Get database info
npm run db:query:local    # Query local database
npm run db:query:remote   # Query production database
npm run cf-typegen        # Generate TypeScript types
```

### Development Scripts
```bash
npm run dev               # Start dev server
npm run build             # Build for production
npm run deploy            # Deploy to Cloudflare
```

---

## 🗂️ Project Structure

```
hrms-project/
├── db/
│   ├── schema.sql              # Database schema with sample data
│   └── test-queries.sql        # Example queries
│
├── src/
│   ├── lib/
│   │   └── db.ts               # Database functions (CRUD operations)
│   └── pages/
│       └── api/
│           ├── employees/      # Employee API endpoints
│           │   ├── index.ts    # GET/POST employees
│           │   └── [id].ts     # GET/PUT/DELETE single employee
│           └── departments/
│               └── index.ts    # GET/POST departments
│
├── Documentation/
│   ├── DB_QUICK_START.md       # Quick start guide
│   ├── SETUP_CHECKLIST.md      # Setup checklist
│   ├── DATABASE_CONFIG.md      # Configuration guide
│   ├── DATABASE_SETUP.md       # API documentation
│   ├── DATABASE_STATUS.md      # Status tracking
│   └── DB_SETUP_SUMMARY.txt    # Visual summary
│
├── wrangler.jsonc              # Cloudflare D1 configuration
├── setup-database.sh           # Automated setup script
└── package.json                # NPM scripts
```

---

## 🎯 Sample Data

Your database comes pre-loaded with realistic test data:

### Departments (5)
1. Engineering
2. Sales & Marketing
3. Human Resources
4. Finance
5. Operations

### Employees (5)
1. **Sarah Johnson** - Senior Developer (Engineering)
2. **Michael Chen** - Sales Manager (Sales & Marketing)
3. **Emily Rodriguez** - HR Specialist (Human Resources)
4. **David Kim** - Financial Analyst (Finance)
5. **Jessica Brown** - Operations Lead (Operations)

Plus attendance records and leave requests!

---

## 🧪 Testing Your Setup

### Verify Database
```bash
# Check tables
npm run db:query:local "SELECT name FROM sqlite_master WHERE type='table';"

# Count employees (should be 5)
npm run db:query:local "SELECT COUNT(*) FROM employees;"

# List all employees
npm run db:query:local "SELECT * FROM employees;"
```

### Test API Endpoints
```bash
# Start server
npm run dev

# Test in another terminal
curl http://localhost:4321/api/employees
curl http://localhost:4321/api/departments
curl http://localhost:4321/api/employees/1
curl "http://localhost:4321/api/employees?search=sarah"
```

### Test in Browser
- Dashboard: http://localhost:4321
- Employees API: http://localhost:4321/api/employees
- Departments API: http://localhost:4321/api/departments

---

## 🔧 Configuration

### Required Steps

1. **Create Database**
   ```bash
   npm run db:create
   ```

2. **Update wrangler.jsonc**
   ```jsonc
   {
     "d1_databases": [{
       "binding": "DB",
       "database_name": "hrms-database",
       "database_id": "your-actual-id-here"
     }]
   }
   ```

3. **Initialize Database**
   ```bash
   npm run db:init:local
   ```

4. **Generate Types**
   ```bash
   npm run cf-typegen
   ```

---

## 🚀 Production Deployment

When ready to deploy:

```bash
# Initialize production database
npm run db:init:remote

# Build and deploy
npm run deploy
```

**Warning**: `db:init:remote` will reset your production database!

---

## 💡 Usage Examples

### Creating an Employee
```typescript
import { createEmployee } from './lib/db';

const newEmployee = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@company.com',
  position: 'Software Engineer',
  join_date: '2025-01-15',
  department_id: 1,
  base_salary: 80000
};

const result = await createEmployee(db, newEmployee);
console.log(`Created employee: ${result.employee_id}`);
```

### Searching Employees
```typescript
import { searchEmployees } from './lib/db';

const results = await searchEmployees(db, 'john', 1, 'active');
```

### Getting Statistics
```typescript
import { getEmployeeStats } from './lib/db';

const stats = await getEmployeeStats(db);
console.log(`Total employees: ${stats.total}`);
console.log(`Active: ${stats.active}`);
```

---

## ⚠️ Important Notes

### Security
- 🔒 Implement authentication before production
- 🔐 Add API key protection
- 🛡️ Validate all inputs

### Data Management
- ✅ Soft deletes by default (status='terminated')
- 📊 Audit trail with created_at/updated_at
- 💾 Regular backups recommended

### Performance
- ⚡ Indexes optimized for common queries
- 📈 Use pagination for large datasets (limit: 100)
- 🎯 Filter on server-side when possible

---

## 🔍 Troubleshooting

### Common Issues

**Database not found**
```bash
# Solution: Initialize database
npm run db:init:local
```

**Type errors**
```bash
# Solution: Generate types
npm run cf-typegen
```

**API returns empty data**
```bash
# Solution: Re-initialize with sample data
npm run db:init:local
```

**Can't connect to database**
```bash
# Check database exists
npm run db:list

# Verify wrangler.jsonc configuration
cat wrangler.jsonc
```

---

## 📚 Additional Resources

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

## 🎉 Success Checklist

Your setup is complete when:

- ✅ Database created and initialized
- ✅ TypeScript types generated
- ✅ Dev server runs without errors
- ✅ API endpoints return sample data
- ✅ Dashboard displays employees
- ✅ All tests pass

---

## 🆘 Need Help?

1. Check **SETUP_CHECKLIST.md** for step-by-step guide
2. Read **DATABASE_CONFIG.md** for detailed configuration
3. See **DATABASE_SETUP.md** for API documentation
4. Review **DB_QUICK_START.md** for quick reference

---

## 🎯 Next Steps

1. ✅ Complete database setup
2. 🧪 Test API endpoints
3. 💻 Explore the dashboard
4. 🎨 Customize for your needs
5. 🚀 Deploy to production

---

**Ready to start?** Run `npm run db:setup` and get coding! 🚀

---

**Version**: 1.0.0  
**Last Updated**: December 10, 2025  
**Status**: ✅ Production Ready
