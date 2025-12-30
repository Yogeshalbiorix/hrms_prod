-- HRMS Database Schema
-- SQLite / Cloudflare D1 Compatible

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS employee_leave_history;
DROP TABLE IF EXISTS employee_attendance;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

-- Departments Table
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    manager_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table
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

-- Employee Attendance Table
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

-- Employee Leave History Table
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

-- Employee Documents Table
CREATE TABLE employee_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    document_type TEXT CHECK(document_type IN ('resume', 'contract', 'id-proof', 'certificate', 'other')) NOT NULL,
    document_name TEXT NOT NULL,
    document_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);


-- Indexes for better query performance
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX idx_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX idx_leave_employee ON employee_leave_history(employee_id);
CREATE INDEX idx_leave_status ON employee_leave_history(status);
