-- Database schema for activity requests (WFH, Partial Day, Regularization)

-- Work From Home Requests Table
CREATE TABLE IF NOT EXISTS work_from_home_requests (
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

CREATE INDEX IF NOT EXISTS idx_wfh_employee ON work_from_home_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_wfh_date ON work_from_home_requests(date);
CREATE INDEX IF NOT EXISTS idx_wfh_status ON work_from_home_requests(status);

-- Partial Day Requests Table
CREATE TABLE IF NOT EXISTS partial_day_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration DECIMAL(4,2), -- Duration in hours
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

CREATE INDEX IF NOT EXISTS idx_partial_employee ON partial_day_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_partial_date ON partial_day_requests(date);
CREATE INDEX IF NOT EXISTS idx_partial_status ON partial_day_requests(status);

-- Attendance Regularization Requests Table
CREATE TABLE IF NOT EXISTS regularization_requests (
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

CREATE INDEX IF NOT EXISTS idx_reg_employee ON regularization_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_reg_date ON regularization_requests(date);
CREATE INDEX IF NOT EXISTS idx_reg_status ON regularization_requests(status);

-- Email Notifications Log Table (Optional - for tracking sent emails)
CREATE TABLE IF NOT EXISTS email_notifications (
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

CREATE INDEX IF NOT EXISTS idx_email_employee ON email_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_email_activity ON email_notifications(activity_type);
CREATE INDEX IF NOT EXISTS idx_email_status ON email_notifications(status);
