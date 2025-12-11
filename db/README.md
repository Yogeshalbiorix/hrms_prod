# HRMS Database

Complete database system for Human Resource Management with comprehensive CRUD operations.

## 📁 Files

- **schema.sql** - Complete database schema with tables, indexes, and sample data
- **test-queries.sql** - Test queries for all operations (SELECT, INSERT, UPDATE, DELETE)

## 🚀 Quick Start

### 1. Setup Database (Cloudflare D1)

```bash
# Create database
wrangler d1 create hrms-database

# Initialize schema
wrangler d1 execute hrms-database --file=./db/schema.sql

# Verify setup
wrangler d1 execute hrms-database --command="SELECT COUNT(*) FROM employees"
```

### 2. Local Development

```bash
# Initialize local database
wrangler d1 execute hrms-database --local --file=./db/schema.sql

# Start dev server
npm run dev
```

## 📊 Database Tables

1. **departments** - Department information
2. **employees** - Complete employee records
3. **employee_attendance** - Daily attendance tracking
4. **employee_leave_history** - Leave request records
5. **employee_documents** - Document management

## 🔌 API Endpoints

### Employees

- `GET /api/employees` - List all employees
- `GET /api/employees?search=john` - Search employees
- `GET /api/employees?status=active` - Filter by status
- `GET /api/employees?stats=true` - Get statistics
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (soft delete)
- `DELETE /api/employees/:id?hard=true` - Permanently delete

### Departments

- `GET /api/departments` - List all departments
- `GET /api/departments?stats=true` - Get with employee counts
- `POST /api/departments` - Create department

## 💡 Example Usage

### Create Employee

```bash
curl -X POST http://localhost:4321/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "position": "Developer",
    "department_id": 1,
    "join_date": "2024-01-22",
    "base_salary": 75000
  }'
```

### Update Employee

```bash
curl -X PUT http://localhost:4321/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Senior Developer",
    "base_salary": 85000
  }'
```

### Get All Employees

```bash
curl http://localhost:4321/api/employees
```

### Delete Employee

```bash
curl -X DELETE http://localhost:4321/api/employees/1
```

## 📖 Documentation

See **DATABASE_SETUP.md** for complete documentation including:

- Detailed table structures
- All API endpoints with examples
- Database functions reference
- Security best practices
- Troubleshooting guide

## 🧪 Testing

Run test queries from `test-queries.sql`:

```bash
# Using wrangler
wrangler d1 execute hrms-database --file=./db/test-queries.sql

# Or copy individual queries and run:
wrangler d1 execute hrms-database --command="SELECT * FROM employees"
```

## 📋 Sample Data

The schema includes sample data:

- 5 Departments (Engineering, Sales, HR, Finance, Operations)
- 5 Sample Employees
- Sample Attendance Records
- Sample Leave Requests

## 🔒 Security Notes

- All queries use parameterized statements (SQL injection safe)
- Soft delete by default (data retention)
- Audit fields (created_by, updated_by, timestamps)
- Foreign key constraints enabled

## 🆘 Support

If you encounter issues:

1. Check DATABASE_SETUP.md troubleshooting section
2. Verify D1 binding in wrangler.jsonc
3. Ensure schema is initialized
4. Check Cloudflare dashboard for D1 errors

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2024
