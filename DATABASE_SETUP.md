# HRMS Database Setup Guide

## 📊 Database Architecture

The HRMS system uses a relational database (SQLite/Cloudflare D1) with a comprehensive schema for managing employee data.

---

## 🗄️ Database Schema

### Tables Overview

1. **departments** - Department information
2. **employees** - Complete employee records
3. **employee_attendance** - Daily attendance tracking
4. **employee_leave_history** - Leave request records
5. **employee_documents** - Document management

---

## 📋 Table Structures

### 1. Departments Table

```sql
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    manager_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique department identifier
- `name` - Department name (unique)
- `description` - Department description
- `manager_id` - Employee ID of department manager
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

---

### 2. Employees Table

```sql
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    
    -- Employment Details
    department_id INTEGER,
    position TEXT NOT NULL,
    employment_type TEXT CHECK(employment_type IN ('full-time', 'part-time', 'contract', 'intern')) DEFAULT 'full-time',
    status TEXT CHECK(status IN ('active', 'on-leave', 'inactive', 'terminated')) DEFAULT 'active',
    join_date DATE NOT NULL,
    termination_date DATE,
    
    -- Compensation
    base_salary DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    
    -- Emergency Contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    
    -- System Fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);
```

**Key Fields:**
- **Identity**: `id`, `employee_id`, `first_name`, `last_name`, `email`
- **Personal**: `phone`, `date_of_birth`, `gender`, `address`, `city`, `state`, `zip_code`, `country`
- **Employment**: `department_id`, `position`, `employment_type`, `status`, `join_date`, `termination_date`
- **Compensation**: `base_salary`, `currency`
- **Emergency**: `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relationship`
- **Audit**: `created_at`, `updated_at`, `created_by`, `updated_by`

**Constraints:**
- `employee_id` must be unique
- `email` must be unique
- `employment_type` must be one of: full-time, part-time, contract, intern
- `status` must be one of: active, on-leave, inactive, terminated
- `gender` must be one of: male, female, other

---

### 3. Employee Attendance Table

```sql
CREATE TABLE employee_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT CHECK(status IN ('present', 'absent', 'late', 'half-day', 'on-leave')) DEFAULT 'present',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, attendance_date)
);
```

---

### 4. Employee Leave History Table

```sql
CREATE TABLE employee_leave_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT CHECK(leave_type IN ('sick', 'vacation', 'personal', 'maternity', 'paternity', 'unpaid')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    approved_by TEXT,
    approval_date DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

---

## 🚀 Setup Instructions

### Option 1: Cloudflare D1 (Production)

#### Step 1: Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create hrms-database

# Copy the database ID from the output
```

#### Step 2: Update wrangler.jsonc

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hrms-database",
      "database_id": "your-database-id-here"
    }
  ]
}
```

#### Step 3: Initialize Schema

```bash
# Run schema file
wrangler d1 execute hrms-database --file=./db/schema.sql

# Verify tables created
wrangler d1 execute hrms-database --command="SELECT name FROM sqlite_master WHERE type='table';"
```

#### Step 4: Deploy

```bash
npm run build
wrangler deploy
```

---

### Option 2: Local Development with D1

```bash
# Create local D1 database
wrangler d1 execute hrms-database --local --file=./db/schema.sql

# Start dev server with local D1
npm run dev
```

---

## 🔌 API Endpoints

### Employee Endpoints

#### GET /api/employees
Get all employees with optional filters

**Query Parameters:**
- `search` - Search term (name, email, employee_id)
- `departmentId` - Filter by department
- `status` - Filter by status (active, on-leave, inactive, terminated)
- `limit` - Results limit (default: 100)
- `offset` - Results offset (default: 0)
- `stats` - Return statistics (true/false)

**Example:**
```bash
# Get all active employees
curl "http://localhost:4321/api/employees?status=active"

# Search employees
curl "http://localhost:4321/api/employees?search=john"

# Get statistics
curl "http://localhost:4321/api/employees?stats=true"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": "EMP001",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@company.com",
      "department_name": "Engineering",
      "position": "Senior Developer",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

#### POST /api/employees
Create new employee

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1-234-567-8900",
  "department_id": 1,
  "position": "Software Engineer",
  "employment_type": "full-time",
  "status": "active",
  "join_date": "2024-01-22",
  "base_salary": 80000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 6,
    "employee_id": "EMP006"
  }
}
```

---

#### GET /api/employees/:id
Get employee by ID

**Example:**
```bash
curl "http://localhost:4321/api/employees/1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_id": "EMP001",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah.johnson@company.com",
    "phone": "+1-234-567-8901",
    "department_id": 1,
    "department_name": "Engineering",
    "position": "Senior Developer",
    "employment_type": "full-time",
    "status": "active",
    "join_date": "2022-01-15",
    "base_salary": 85000.00,
    "created_at": "2024-01-22T10:00:00Z"
  }
}
```

---

#### PUT /api/employees/:id
Update employee

**Request Body (partial update):**
```json
{
  "position": "Lead Developer",
  "base_salary": 95000.00,
  "updated_by": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": 1,
    "employee_id": "EMP001",
    "position": "Lead Developer",
    "base_salary": 95000.00
  }
}
```

---

#### DELETE /api/employees/:id
Delete employee (soft delete by default)

**Query Parameters:**
- `hard=true` - Permanently delete (use with caution)

**Example:**
```bash
# Soft delete (set status to terminated)
curl -X DELETE "http://localhost:4321/api/employees/1"

# Hard delete (permanent)
curl -X DELETE "http://localhost:4321/api/employees/1?hard=true"
```

**Response:**
```json
{
  "success": true,
  "message": "Employee terminated successfully"
}
```

---

### Department Endpoints

#### GET /api/departments
Get all departments

**Query Parameters:**
- `stats=true` - Include employee counts

**Example:**
```bash
curl "http://localhost:4321/api/departments"

# With statistics
curl "http://localhost:4321/api/departments?stats=true"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Engineering",
      "description": "Software development team"
    }
  ],
  "count": 5
}
```

---

#### POST /api/departments
Create new department

**Request Body:**
```json
{
  "name": "Customer Success",
  "description": "Customer support and success team"
}
```

---

## 💾 Database Functions

### Available Functions in `src/lib/db.ts`

#### Employee Operations

```typescript
// Get all employees with pagination
getAllEmployees(db, limit?, offset?)

// Get employee by ID
getEmployeeById(db, id)

// Get employee by employee ID
getEmployeeByEmployeeId(db, employeeId)

// Search employees
searchEmployees(db, searchTerm, departmentId?, status?)

// Create employee
createEmployee(db, employee)

// Update employee
updateEmployee(db, id, partialEmployee)

// Soft delete employee
deleteEmployee(db, id)

// Hard delete employee
hardDeleteEmployee(db, id)

// Get statistics
getEmployeeStats(db)

// Get employees by department
getEmployeesByDepartment(db)
```

#### Department Operations

```typescript
// Get all departments
getAllDepartments(db)

// Get department by ID
getDepartmentById(db, id)

// Create department
createDepartment(db, department)
```

---

## 📝 Example Usage

### Creating an Employee

```typescript
import { createEmployee } from './lib/db';

const newEmployee = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@company.com',
  phone: '+1-555-123-4567',
  department_id: 1,
  position: 'Product Manager',
  employment_type: 'full-time',
  status: 'active',
  join_date: '2024-01-15',
  base_salary: 90000.00,
  emergency_contact_name: 'John Smith',
  emergency_contact_phone: '+1-555-987-6543',
  emergency_contact_relationship: 'Spouse'
};

const result = await createEmployee(db, newEmployee);
console.log(`Employee created with ID: ${result.employee_id}`);
```

### Updating an Employee

```typescript
import { updateEmployee } from './lib/db';

await updateEmployee(db, 1, {
  position: 'Senior Product Manager',
  base_salary: 105000.00,
  status: 'active'
});
```

### Searching Employees

```typescript
import { searchEmployees } from './lib/db';

// Search by name or email
const results = await searchEmployees(db, 'john');

// Search with filters
const engineeringEmployees = await searchEmployees(
  db, 
  'developer', 
  1, // department_id
  'active' // status
);
```

---

## 🔒 Security Considerations

### Best Practices

1. **Input Validation**
   - Always validate input before database operations
   - Use parameterized queries (already implemented)
   - Validate email formats, dates, and enums

2. **Authentication**
   - Implement authentication before production
   - Use API keys or JWT tokens
   - Verify user permissions for operations

3. **Data Privacy**
   - Encrypt sensitive data (SSN, etc.) if storing
   - Implement field-level access control
   - Log all data access for audit trails

4. **Soft Deletes**
   - Default to soft deletes (status = 'terminated')
   - Keep termination_date for compliance
   - Only hard delete for GDPR/legal requirements

---

## 🧪 Testing the API

### Using cURL

```bash
# Create employee
curl -X POST http://localhost:4321/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@company.com",
    "position": "Developer",
    "join_date": "2024-01-22"
  }'

# Get all employees
curl http://localhost:4321/api/employees

# Get specific employee
curl http://localhost:4321/api/employees/1

# Update employee
curl -X PUT http://localhost:4321/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{"position": "Senior Developer"}'

# Delete employee
curl -X DELETE http://localhost:4321/api/employees/1
```

### Using JavaScript/TypeScript

```typescript
import { baseUrl } from './lib/base-url';

// Create employee
const response = await fetch(`${baseUrl}/api/employees`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@company.com',
    position: 'Developer',
    join_date: '2024-01-22'
  })
});

const result = await response.json();
console.log(result);
```

---

## 📊 Database Indexes

For optimal performance, the following indexes are created:

```sql
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX idx_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX idx_leave_employee ON employee_leave_history(employee_id);
CREATE INDEX idx_leave_status ON employee_leave_history(status);
```

---

## 🔄 Data Migration

### Exporting Data

```bash
# Export to CSV (D1)
wrangler d1 execute hrms-database --command="SELECT * FROM employees" --json > employees.json
```

### Importing Data

```bash
# Import from SQL file
wrangler d1 execute hrms-database --file=./data/import.sql
```

---

## 📈 Monitoring & Maintenance

### Regular Tasks

1. **Backup Database**
   ```bash
   wrangler d1 backup create hrms-database
   ```

2. **Check Statistics**
   ```sql
   SELECT status, COUNT(*) as count 
   FROM employees 
   GROUP BY status;
   ```

3. **Clean Old Records**
   ```sql
   DELETE FROM employee_attendance 
   WHERE attendance_date < DATE('now', '-1 year');
   ```

---

## 🆘 Troubleshooting

### Common Issues

#### Database not found
```
Error: Database not configured
```
**Solution:** Ensure D1 binding is configured in wrangler.jsonc

#### Unique constraint violation
```
Error: UNIQUE constraint failed: employees.email
```
**Solution:** Email already exists. Use a different email or update existing record.

#### Foreign key constraint
```
Error: FOREIGN KEY constraint failed
```
**Solution:** Department ID doesn't exist. Create department first or use NULL.

---

## 📚 Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQL Tutorial](https://www.w3schools.com/sql/)

---

**Database Status**: ✅ Production Ready
**Last Updated**: January 2024
**Version**: 1.0.0
