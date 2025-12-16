-- Disable foreign key checks temporarily
PRAGMA foreign_keys = OFF;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS employee_leave_history;
DROP TABLE IF EXISTS employee_attendance;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS regularization_requests;
DROP TABLE IF EXISTS partial_day_requests;
DROP TABLE IF EXISTS work_from_home_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS user_audit_log;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS payroll;

-- Now create all tables and insert data
PRAGMA defer_foreign_keys=TRUE;

CREATE TABLE payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    base_salary DECIMAL(10, 2) DEFAULT 0.00,
    bonuses DECIMAL(10, 2) DEFAULT 0.00,
    deductions DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    net_salary DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT CHECK(status IN ('draft', 'pending', 'approved', 'paid', 'cancelled')) DEFAULT 'draft',
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    approved_by TEXT,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'hr', 'manager', 'employee')) DEFAULT 'employee',
    employee_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    phone TEXT,
    profile_image TEXT,
    email_verified BOOLEAN DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    last_password_change DATETIME,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

INSERT INTO users VALUES(1,'admin','admin@hrms.com','$2b$10$Mn9SIcSaxMvr98A0V2KQF.2PjS.qdJ8HYdcTwc5hCMAJQB4VAAgN.','System Administrator','admin',NULL,1,NULL,'2025-12-15 09:45:38','2025-12-15 09:45:38',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(3,'yogeshpurnawasi','Yogesh.albiorix@gmail.com','$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ','Yogesh purnawasi','employee',NULL,1,NULL,'2025-12-15 07:33:46','2025-12-15 07:33:46',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(4,'pushpakmakwana','pushpakm.albiorix@gmail.com','$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ','Pushpak Makwana','employee',NULL,1,NULL,'2025-12-15 07:33:46','2025-12-15 07:33:46',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(5,'krishnaraval','Krishna.albiorix@gmail.com','$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ','Krishna Raval','employee',NULL,1,NULL,'2025-12-15 07:33:46','2025-12-15 07:33:46',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(6,'abhaybhatti','abhay.albiorix@gmail.com','$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ','Abhay bhatti','employee',NULL,1,NULL,'2025-12-15 07:33:46','2025-12-15 07:33:46',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(7,'hirenm','hiren.albiorix@gmail.com','$2b$10$gj/JzWDVYIl5zzxryOYIOORYyio445hWljLBs0yNaPLs2PEONeCl2','Hiren Mandaliya','employee',NULL,1,'2025-12-16 09:05:17','2025-12-15 07:37:30','2025-12-15 07:37:30',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(8,'hrmanager1','hrmanager1@hrms.com','$2b$10$Mn9SIcSaxMvr98A0V2KQF.2PjS.qdJ8HYdcTwc5hCMAJQB4VAAgN.','HR Manager','admin',NULL,1,'2025-12-16 10:22:55','2025-12-15 09:45:38','2025-12-15 09:45:38',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(9,'hrmanager2','hrmanager2@hrms.com','$2b$10$Mn9SIcSaxMvr98A0V2KQF.2PjS.qdJ8HYdcTwc5hCMAJQB4VAAgN.','HR Executive','admin',NULL,1,NULL,'2025-12-15 09:45:38','2025-12-15 09:45:38',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(10,'kevaljain','kevalJain.albiorix@gmail.com','$2b$10$P74gPpdMjyknYsUq4KFVCeZyrwYMLHa8R1mEIzrkFhXtDdkwpnd.e','Keval Jain','employee',NULL,1,'2025-12-16 09:06:24','2025-12-16 06:06:47','2025-12-16 06:06:47',NULL,NULL,0,0,0,NULL,NULL);
INSERT INTO users VALUES(11,'Yogeshp','yogeshp@gmail.com','$2b$10$/ibRM/ZAQBshnhvR6PQMOeU1cfXkUsAxVMUBdKMuU1m/TluTCby0G','Yogesh P','employee',6,1,'2025-12-16 10:22:39','2025-12-16 10:22:33','2025-12-16 10:22:33',NULL,NULL,0,0,0,NULL,NULL);

CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO sessions VALUES(15,8,'3043a844d963d787e23e954d8910a03c66f96a487a1d02d0b1be290c7c180502','2025-12-16T10:15:03.814Z','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-15 10:15:03');
INSERT INTO sessions VALUES(21,8,'5c278d1c38717c5adff383c9f30e9b01e9967e74dc1ea10e7533e82a2dfa2b04','2025-12-16T13:20:33.798Z','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-15 13:20:33');
INSERT INTO sessions VALUES(23,8,'7378abf40fd10af946f25888f77e715bb32e2773fa64d5641f7b6a1b1757da37','2025-12-16T13:35:54.603Z','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-15 13:35:54');
INSERT INTO sessions VALUES(34,10,'88086f2830c07467e6013a056a3d3ca415382abdc0667096ac0cc3b482fcb7f5','2025-12-17T09:06:24.239Z','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-16 09:06:24');
INSERT INTO sessions VALUES(36,8,'9e6e28c9eb0e83d625abe2659f70f11dc0fb8516fffd2f4c1f9bffe0772743e2','2025-12-17T10:22:55.638Z','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-16 10:22:55');

CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_name TEXT NOT NULL,
    granted_by INTEGER,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, permission_name)
);

CREATE TABLE user_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO user_audit_log VALUES(1,7,'USER_REGISTERED','User hirenm registered successfully','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-15 07:37:30');
INSERT INTO user_audit_log VALUES(2,10,'USER_REGISTERED','User kevaljain registered successfully','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-16 06:06:47');
INSERT INTO user_audit_log VALUES(3,11,'USER_REGISTERED','User Yogeshp registered successfully','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2025-12-16 10:22:33');

CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    user_id INTEGER,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    working_hours TEXT,
    work_mode TEXT DEFAULT 'office',
    status TEXT CHECK(status IN ('present', 'absent', 'late', 'half-day', 'on-leave')) DEFAULT 'present',
    notes TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE work_from_home_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER,
  approval_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE partial_day_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration DECIMAL(4,2), 
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER,
  approval_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE regularization_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  clock_in TIME NOT NULL,
  clock_out TIME NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER,
  approval_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE email_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    manager_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments VALUES(1,'Engineering','Software development and engineering team',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO departments VALUES(2,'Sales & Marketing','Sales and marketing operations',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO departments VALUES(3,'Human Resources','HR and talent management',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO departments VALUES(4,'Finance','Financial operations and accounting',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO departments VALUES(5,'Operations','Operations and logistics management',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');

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
    department_id INTEGER,
    position TEXT NOT NULL,
    employment_type TEXT CHECK(employment_type IN ('full-time', 'part-time', 'contract', 'intern')) DEFAULT 'full-time',
    status TEXT CHECK(status IN ('active', 'on-leave', 'inactive', 'terminated')) DEFAULT 'active',
    join_date DATE NOT NULL,
    termination_date DATE,
    base_salary DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    manager_id INTEGER,
    hierarchy_level INTEGER DEFAULT 5,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

INSERT INTO employees VALUES(1,'EMP001','Sarah','Johnson','sarah.johnson@company.com','+1-234-567-8901',NULL,NULL,NULL,NULL,NULL,NULL,'USA',1,'Senior Developer','full-time','active','2022-01-15',NULL,85000,'USD',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:20:12',NULL,'system',2,4);
INSERT INTO employees VALUES(2,'EMP002','Michael','Chen','michael.chen@company.com','+1-234-567-8902',NULL,NULL,NULL,NULL,NULL,NULL,'USA',2,'Sales Manager','full-time','active','2021-06-20',NULL,72000,'USD',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30',NULL,NULL,NULL,3);
INSERT INTO employees VALUES(3,'EMP003','Emily','Rodriguez','emily.rodriguez@company.com','+1-234-567-8903',NULL,NULL,NULL,NULL,NULL,NULL,'USA',3,'HR Specialist','full-time','on-leave','2023-03-10',NULL,68000,'USD',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30',NULL,NULL,NULL,5);
INSERT INTO employees VALUES(4,'EMP004','David','Kim','david.kim@company.com','+1-234-567-8904',NULL,NULL,NULL,NULL,NULL,NULL,'USA',4,'Financial Analyst','full-time','active','2022-09-05',NULL,75000,'USD',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30',NULL,NULL,NULL,5);
INSERT INTO employees VALUES(5,'EMP005','Jessica','Brown','jessica.brown@company.com','+1-234-567-8905',NULL,NULL,NULL,NULL,NULL,NULL,'USA',5,'Operations Lead','full-time','active','2021-11-18',NULL,78000,'USD',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30',NULL,NULL,NULL,3);
INSERT INTO employees VALUES(6,'EMP006','Yogesh','P','yogeshp@gmail.com','1234567890',NULL,NULL,NULL,NULL,NULL,NULL,'USA',1,'Sr. webflow developer','full-time','active','2025-12-16',NULL,0,'USD',NULL,NULL,NULL,'2025-12-16 10:22:33','2025-12-16 10:23:13','system','system',NULL,5);

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

INSERT INTO employee_attendance VALUES(1,1,'2024-01-22','08:45:00','17:30:00','present',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO employee_attendance VALUES(2,2,'2024-01-22','08:50:00','17:45:00','present',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO employee_attendance VALUES(3,3,'2024-01-22',NULL,NULL,'on-leave',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO employee_attendance VALUES(4,4,'2024-01-22','08:40:00','17:20:00','present',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO employee_attendance VALUES(5,5,'2024-01-22','09:05:00','18:00:00','late',NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');

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

INSERT INTO employee_leave_history VALUES(1,1,'sick','2024-01-25','2024-01-27',3,'Medical appointment and recovery','pending',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO employee_leave_history VALUES(2,2,'vacation','2024-02-10','2024-02-17',8,'Family vacation','approved',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');
INSERT INTO employee_leave_history VALUES(3,3,'personal','2024-01-22','2024-01-22',1,'Personal matters','approved',NULL,NULL,NULL,'2025-12-16 10:19:30','2025-12-16 10:19:30');

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

-- Create indexes
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_status ON payroll(status);
CREATE INDEX idx_payroll_pay_date ON payroll(pay_date);
CREATE INDEX idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX idx_audit_log_action ON user_audit_log(action);
CREATE INDEX idx_wfh_employee ON work_from_home_requests(employee_id);
CREATE INDEX idx_wfh_date ON work_from_home_requests(date);
CREATE INDEX idx_wfh_status ON work_from_home_requests(status);
CREATE INDEX idx_partial_employee ON partial_day_requests(employee_id);
CREATE INDEX idx_partial_date ON partial_day_requests(date);
CREATE INDEX idx_partial_status ON partial_day_requests(status);
CREATE INDEX idx_reg_employee ON regularization_requests(employee_id);
CREATE INDEX idx_reg_date ON regularization_requests(date);
CREATE INDEX idx_reg_status ON regularization_requests(status);
CREATE INDEX idx_email_employee ON email_notifications(employee_id);
CREATE INDEX idx_email_activity ON email_notifications(activity_type);
CREATE INDEX idx_email_status ON email_notifications(status);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX idx_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX idx_leave_employee ON employee_leave_history(employee_id);
CREATE INDEX idx_leave_status ON employee_leave_history(status);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_hierarchy_level ON employees(hierarchy_level);

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
