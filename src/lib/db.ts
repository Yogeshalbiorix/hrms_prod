// Database utility functions for employee management
// Compatible with Cloudflare D1 and SQLite

export interface Employee {
  id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  department_id?: number;
  position: string;
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'intern';
  status?: 'active' | 'on-leave' | 'inactive' | 'terminated';
  join_date: string;
  termination_date?: string;
  base_salary?: number;
  currency?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Department {
  id?: number;
  name: string;
  description?: string;
  manager_id?: number;
}

export interface EmployeeWithDepartment extends Employee {
  department_name?: string;
}

// Get database instance (works with Cloudflare D1)
export function getDB(env: any) {
  return env.DB; // Cloudflare D1 binding
}

// Generate unique employee ID
export function generateEmployeeId(count: number): string {
  return `EMP${String(count + 1).padStart(3, '0')}`;
}

// Employee CRUD Operations

export async function getAllEmployees(db: any, limit = 100, offset = 0): Promise<EmployeeWithDepartment[]> {
  const query = `
    SELECT 
      e.*,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const result = await db.prepare(query).bind(limit, offset).all();
  return result.results || [];
}

export async function getEmployeeById(db: any, id: number): Promise<EmployeeWithDepartment | null> {
  const query = `
    SELECT 
      e.*,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = ?
  `;

  const result = await db.prepare(query).bind(id).first();
  return result || null;
}

export async function getEmployeeByEmployeeId(db: any, employeeId: string): Promise<EmployeeWithDepartment | null> {
  const query = `
    SELECT 
      e.*,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.employee_id = ?
  `;

  const result = await db.prepare(query).bind(employeeId).first();
  return result || null;
}

export async function searchEmployees(
  db: any,
  searchTerm: string,
  departmentId?: number,
  status?: string
): Promise<EmployeeWithDepartment[]> {
  let query = `
    SELECT 
      e.*,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE (
      e.first_name LIKE ? OR 
      e.last_name LIKE ? OR 
      e.email LIKE ? OR
      e.employee_id LIKE ?
    )
  `;

  const params: any[] = [
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`
  ];

  if (departmentId) {
    query += ` AND e.department_id = ?`;
    params.push(departmentId);
  }

  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY e.created_at DESC LIMIT 100`;

  const result = await db.prepare(query).bind(...params).all();
  return result.results || [];
}

export async function createEmployee(db: any, employee: Employee, syncRemote: boolean = false): Promise<{ id: number; employee_id: string; username?: string; password?: string }> {
  // Get count for employee ID generation
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM employees').first();
  const count = countResult?.count || 0;

  const employeeId = employee.employee_id || generateEmployeeId(count);

  const query = `
    INSERT INTO employees (
      employee_id, first_name, last_name, email, phone,
      date_of_birth, gender, address, city, state, zip_code, country,
      department_id, position, employment_type, status, join_date,
      base_salary, currency,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Helper function to convert empty strings to null
  const toNull = (value: any) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const params = [
    employeeId,
    employee.first_name,
    employee.last_name,
    employee.email,
    toNull(employee.phone),
    toNull(employee.date_of_birth),
    toNull(employee.gender),
    toNull(employee.address),
    toNull(employee.city),
    toNull(employee.state),
    toNull(employee.zip_code),
    employee.country || 'USA',
    toNull(employee.department_id),
    employee.position,
    employee.employment_type || 'full-time',
    employee.status || 'active',
    employee.join_date,
    employee.base_salary || 0,
    employee.currency || 'USD',
    toNull(employee.emergency_contact_name),
    toNull(employee.emergency_contact_phone),
    toNull(employee.emergency_contact_relationship),
    toNull(employee.created_by) || 'system',
    toNull(employee.updated_by) || 'system'
  ];

  const result = await db.prepare(query).bind(...params).run();
  const newEmployeeId = result.meta.last_row_id;

  // Automatically create user account for the employee
  let username: string | undefined;
  let generatedPassword: string | undefined;

  try {
    // Import bcryptjs for password hashing
    const bcrypt = await import('bcryptjs');

    // Generate username from email (part before @) or first name + last name
    username = employee.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if username already exists, if so, append employee ID
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUser) {
      username = `${username}${employeeId.slice(-3)}`;
    }

    // Generate a random password (8 characters: letters + numbers)
    generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();

    // Hash the password
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Determine role based on position (default to 'employee')
    let role = 'employee';
    const positionLower = employee.position?.toLowerCase() || '';
    if (positionLower.includes('admin') || positionLower.includes('administrator')) {
      role = 'admin';
    } else if (positionLower.includes('hr') || positionLower.includes('human resource')) {
      role = 'hr';
    } else if (positionLower.includes('manager')) {
      role = 'manager';
    }

    // Create user account
    const fullName = `${employee.first_name} ${employee.last_name}`;
    await db.prepare(
      'INSERT INTO users (username, password_hash, email, full_name, role, employee_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
    ).bind(username, passwordHash, employee.email, fullName, role, newEmployeeId).run();

    console.log(`User account created for employee ${employeeId}: username=${username}`);
  } catch (error) {
    console.error('Error creating user account for employee:', error);
    // Don't fail the employee creation if user account creation fails
  }

  // Sync to remote database if enabled
  if (syncRemote) {
    try {
      const { executeSync } = await import('./db-sync');
      await executeSync(db, query, params);
    } catch (error) {
      console.warn('Remote sync failed for employee creation:', error);
      // Don't fail the operation if remote sync fails
    }
  }

  return {
    id: newEmployeeId,
    employee_id: employeeId,
    username,
    password: generatedPassword
  };
}

export async function updateEmployee(db: any, id: number, employee: Partial<Employee>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  // Helper function to convert empty strings to null
  const toNull = (value: any) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  // Build dynamic update query
  if (employee.first_name !== undefined) {
    fields.push('first_name = ?');
    values.push(employee.first_name);
  }
  if (employee.last_name !== undefined) {
    fields.push('last_name = ?');
    values.push(employee.last_name);
  }
  if (employee.email !== undefined) {
    fields.push('email = ?');
    values.push(employee.email);
  }
  if (employee.phone !== undefined) {
    fields.push('phone = ?');
    values.push(toNull(employee.phone));
  }
  if (employee.date_of_birth !== undefined) {
    fields.push('date_of_birth = ?');
    values.push(toNull(employee.date_of_birth));
  }
  if (employee.gender !== undefined) {
    fields.push('gender = ?');
    values.push(toNull(employee.gender));
  }
  if (employee.address !== undefined) {
    fields.push('address = ?');
    values.push(toNull(employee.address));
  }
  if (employee.city !== undefined) {
    fields.push('city = ?');
    values.push(toNull(employee.city));
  }
  if (employee.state !== undefined) {
    fields.push('state = ?');
    values.push(toNull(employee.state));
  }
  if (employee.zip_code !== undefined) {
    fields.push('zip_code = ?');
    values.push(toNull(employee.zip_code));
  }
  if (employee.country !== undefined) {
    fields.push('country = ?');
    values.push(employee.country || 'USA');
  }
  if (employee.department_id !== undefined) {
    fields.push('department_id = ?');
    values.push(toNull(employee.department_id));
  }
  if (employee.position !== undefined) {
    fields.push('position = ?');
    values.push(employee.position);
  }
  if (employee.employment_type !== undefined) {
    fields.push('employment_type = ?');
    values.push(employee.employment_type);
  }
  if (employee.status !== undefined) {
    fields.push('status = ?');
    values.push(employee.status);
  }
  if (employee.base_salary !== undefined) {
    fields.push('base_salary = ?');
    values.push(employee.base_salary || 0);
  }
  if (employee.termination_date !== undefined) {
    fields.push('termination_date = ?');
    values.push(toNull(employee.termination_date));
  }
  if (employee.emergency_contact_name !== undefined) {
    fields.push('emergency_contact_name = ?');
    values.push(toNull(employee.emergency_contact_name));
  }
  if (employee.emergency_contact_phone !== undefined) {
    fields.push('emergency_contact_phone = ?');
    values.push(toNull(employee.emergency_contact_phone));
  }
  if (employee.emergency_contact_relationship !== undefined) {
    fields.push('emergency_contact_relationship = ?');
    values.push(toNull(employee.emergency_contact_relationship));
  }
  if (employee.manager_id !== undefined) {
    fields.push('manager_id = ?');
    values.push(toNull(employee.manager_id));
  }
  if (employee.hierarchy_level !== undefined) {
    fields.push('hierarchy_level = ?');
    values.push(employee.hierarchy_level);
  }

  // Always update the updated_at and updated_by fields
  fields.push('updated_at = CURRENT_TIMESTAMP');
  fields.push('updated_by = ?');
  values.push(toNull(employee.updated_by) || 'system');

  if (fields.length === 2) { // Only updated_at and updated_by
    return false;
  }

  const query = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  const result = await db.prepare(query).bind(...values).run();
  return result.success;
}

export async function deleteEmployee(db: any, id: number): Promise<boolean> {
  // Soft delete - set status to terminated
  const query = `
    UPDATE employees 
    SET status = 'terminated', 
        termination_date = DATE('now'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const result = await db.prepare(query).bind(id).run();
  return result.success;
}

export async function hardDeleteEmployee(db: any, id: number): Promise<boolean> {
  // Hard delete - permanently remove from database
  const query = `DELETE FROM employees WHERE id = ?`;
  const result = await db.prepare(query).bind(id).run();
  return result.success;
}

// Department Operations

export async function getAllDepartments(db: any): Promise<Department[]> {
  const query = `SELECT * FROM departments ORDER BY name`;
  const result = await db.prepare(query).all();
  return result.results || [];
}

export async function getDepartmentById(db: any, id: number): Promise<Department | null> {
  const query = `SELECT * FROM departments WHERE id = ?`;
  const result = await db.prepare(query).bind(id).first();
  return result || null;
}

export async function createDepartment(db: any, department: Department, syncRemote: boolean = false): Promise<number> {
  const query = `
    INSERT INTO departments (name, description, manager_id)
    VALUES (?, ?, ?)
  `;

  // Helper function to convert empty strings to null
  const toNull = (value: any) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const params = [
    department.name,
    toNull(department.description),
    toNull(department.manager_id)
  ];

  const result = await db.prepare(query).bind(...params).run();

  // Sync to remote database if enabled
  if (syncRemote) {
    try {
      const { executeSync } = await import('./db-sync');
      await executeSync(db, query, params);
    } catch (error) {
      console.warn('Remote sync failed for department creation:', error);
    }
  }

  return result.meta.last_row_id;
}

export async function updateDepartment(db: any, id: number, department: Partial<Department>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  const toNull = (value: any) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  if (department.name !== undefined) {
    fields.push('name = ?');
    values.push(department.name);
  }
  if (department.description !== undefined) {
    fields.push('description = ?');
    values.push(toNull(department.description));
  }
  if (department.manager_id !== undefined) {
    fields.push('manager_id = ?');
    values.push(toNull(department.manager_id));
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');

  if (fields.length === 1) {
    return false;
  }

  const query = `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  const result = await db.prepare(query).bind(...values).run();
  return result.success;
}

export async function deleteDepartment(db: any, id: number): Promise<boolean> {
  const query = `DELETE FROM departments WHERE id = ?`;
  const result = await db.prepare(query).bind(id).run();
  return result.success;
}

export async function getDepartmentEmployeeCount(db: any, departmentId: number): Promise<number> {
  const query = `
    SELECT COUNT(*) as count 
    FROM employees 
    WHERE department_id = ? AND status != 'terminated'
  `;
  const result = await db.prepare(query).bind(departmentId).first();
  return result?.count || 0;
}

// Statistics and Reports

export async function getEmployeeStats(db: any) {
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) as on_leave,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
      SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) as terminated
    FROM employees
  `).first();

  return stats;
}

export async function getEmployeesByDepartment(db: any) {
  const result = await db.prepare(`
    SELECT 
      d.name as department,
      COUNT(e.id) as count
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
    GROUP BY d.id, d.name
    ORDER BY count DESC
  `).all();

  return result.results || [];
}

// Attendance Management

export interface Attendance {
  id?: number;
  employee_id: number;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceWithEmployee extends Attendance {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
}

export async function getAllAttendance(
  db: any,
  filters?: { date?: string; employee_id?: number; status?: string },
  limit = 100,
  offset = 0
): Promise<AttendanceWithEmployee[]> {
  let query = `
    SELECT 
      a.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_id as employee_code,
      d.name as department_name
    FROM employee_attendance a
    INNER JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;

  const bindings: any[] = [];

  if (filters?.date) {
    query += ` AND a.attendance_date = ?`;
    bindings.push(filters.date);
  }

  if (filters?.employee_id) {
    query += ` AND a.employee_id = ?`;
    bindings.push(filters.employee_id);
  }

  if (filters?.status) {
    query += ` AND a.status = ?`;
    bindings.push(filters.status);
  }

  query += ` ORDER BY a.attendance_date DESC, a.check_in_time DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

export async function getAttendanceById(db: any, id: number): Promise<AttendanceWithEmployee | null> {
  const query = `
    SELECT 
      a.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_id as employee_code,
      d.name as department_name
    FROM employee_attendance a
    INNER JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE a.id = ?
  `;

  const result = await db.prepare(query).bind(id).first();
  return result || null;
}

export async function createAttendance(db: any, attendance: Attendance): Promise<number> {
  const query = `
    INSERT INTO employee_attendance (
      employee_id, attendance_date, check_in_time, check_out_time, 
      status, notes
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = await db.prepare(query).bind(
    attendance.employee_id,
    attendance.attendance_date,
    attendance.check_in_time || null,
    attendance.check_out_time || null,
    attendance.status,
    attendance.notes || null
  ).run();

  return result.meta.last_row_id;
}

export async function updateAttendance(db: any, id: number, attendance: Partial<Attendance>): Promise<boolean> {
  const updates: string[] = [];
  const bindings: any[] = [];

  if (attendance.check_in_time !== undefined) {
    updates.push('check_in_time = ?');
    bindings.push(attendance.check_in_time);
  }

  if (attendance.check_out_time !== undefined) {
    updates.push('check_out_time = ?');
    bindings.push(attendance.check_out_time);
  }

  if (attendance.status) {
    updates.push('status = ?');
    bindings.push(attendance.status);
  }

  if (attendance.notes !== undefined) {
    updates.push('notes = ?');
    bindings.push(attendance.notes);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  const query = `UPDATE employee_attendance SET ${updates.join(', ')} WHERE id = ?`;
  const result = await db.prepare(query).bind(...bindings).run();

  return result.success;
}

export async function deleteAttendance(db: any, id: number): Promise<boolean> {
  const query = `DELETE FROM employee_attendance WHERE id = ?`;
  const result = await db.prepare(query).bind(id).run();
  return result.success;
}

export async function getAttendanceStats(db: any, date?: string) {
  let query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'half-day' THEN 1 ELSE 0 END) as half_day,
      SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) as on_leave
    FROM employee_attendance
  `;

  const bindings: any[] = [];

  if (date) {
    query += ` WHERE attendance_date = ?`;
    bindings.push(date);
  }

  const result = await db.prepare(query).bind(...bindings).first();
  return result;
}

// Leave Management

export interface Leave {
  id?: number;
  employee_id: number;
  leave_type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approval_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveWithEmployee extends Leave {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
}

export async function getAllLeaves(
  db: any,
  filters?: { employee_id?: number; status?: string; leave_type?: string },
  limit = 100,
  offset = 0
): Promise<LeaveWithEmployee[]> {
  let query = `
    SELECT 
      l.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_id as employee_code,
      d.name as department_name
    FROM employee_leave_history l
    INNER JOIN employees e ON l.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;

  const bindings: any[] = [];

  if (filters?.employee_id) {
    query += ` AND l.employee_id = ?`;
    bindings.push(filters.employee_id);
  }

  if (filters?.status) {
    query += ` AND l.status = ?`;
    bindings.push(filters.status);
  }

  if (filters?.leave_type) {
    query += ` AND l.leave_type = ?`;
    bindings.push(filters.leave_type);
  }

  query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

export async function getLeaveById(db: any, id: number): Promise<LeaveWithEmployee | null> {
  const query = `
    SELECT 
      l.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_id as employee_code,
      d.name as department_name
    FROM employee_leave_history l
    INNER JOIN employees e ON l.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE l.id = ?
  `;

  const result = await db.prepare(query).bind(id).first();
  return result || null;
}

export async function createLeave(db: any, leave: Leave, syncRemote: boolean = false): Promise<number> {
  const query = `
    INSERT INTO employee_leave_history (
      employee_id, leave_type, start_date, end_date, total_days,
      reason, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    leave.employee_id,
    leave.leave_type,
    leave.start_date,
    leave.end_date,
    leave.total_days,
    leave.reason || null,
    leave.status,
    leave.notes || null
  ];

  const result = await db.prepare(query).bind(...params).run();

  // Sync to remote database if enabled
  if (syncRemote) {
    try {
      const { executeSync } = await import('./db-sync');
      await executeSync(db, query, params);
    } catch (error) {
      console.warn('Remote sync failed for leave creation:', error);
    }
  }

  return result.meta.last_row_id;
}

export async function updateLeave(db: any, id: number, leave: Partial<Leave>): Promise<boolean> {
  const updates: string[] = [];
  const bindings: any[] = [];

  if (leave.leave_type) {
    updates.push('leave_type = ?');
    bindings.push(leave.leave_type);
  }

  if (leave.start_date) {
    updates.push('start_date = ?');
    bindings.push(leave.start_date);
  }

  if (leave.end_date) {
    updates.push('end_date = ?');
    bindings.push(leave.end_date);
  }

  if (leave.total_days !== undefined) {
    updates.push('total_days = ?');
    bindings.push(leave.total_days);
  }

  if (leave.reason !== undefined) {
    updates.push('reason = ?');
    bindings.push(leave.reason);
  }

  if (leave.status) {
    updates.push('status = ?');
    bindings.push(leave.status);
  }

  if (leave.approved_by !== undefined) {
    updates.push('approved_by = ?');
    bindings.push(leave.approved_by);
  }

  if (leave.approval_date !== undefined) {
    updates.push('approval_date = ?');
    bindings.push(leave.approval_date);
  }

  if (leave.notes !== undefined) {
    updates.push('notes = ?');
    bindings.push(leave.notes);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  const query = `UPDATE employee_leave_history SET ${updates.join(', ')} WHERE id = ?`;
  const result = await db.prepare(query).bind(...bindings).run();

  return result.success;
}

export async function deleteLeave(db: any, id: number): Promise<boolean> {
  const query = `DELETE FROM employee_leave_history WHERE id = ?`;
  const result = await db.prepare(query).bind(id).run();
  return result.success;
}

export async function getLeaveStats(db: any) {
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM employee_leave_history
  `).first();

  return stats;
}

// Payroll Management

export interface Payroll {
  id?: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  tax: number;
  net_salary: number;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  approved_by?: string;
}

export interface PayrollWithEmployee extends Payroll {
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  position?: string;
}

export async function getAllPayrolls(
  db: any,
  filters?: { employee_id?: number; status?: string; pay_period?: string },
  limit = 100,
  offset = 0
): Promise<PayrollWithEmployee[]> {
  let query = `
    SELECT 
      p.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_id as employee_code,
      d.name as department_name,
      e.position
    FROM payroll p
    INNER JOIN employees e ON p.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;

  const bindings: any[] = [];

  if (filters?.employee_id) {
    query += ` AND p.employee_id = ?`;
    bindings.push(filters.employee_id);
  }

  if (filters?.status) {
    query += ` AND p.status = ?`;
    bindings.push(filters.status);
  }

  if (filters?.pay_period) {
    query += ` AND (p.pay_period_start <= ? AND p.pay_period_end >= ?)`;
    bindings.push(filters.pay_period, filters.pay_period);
  }

  query += ` ORDER BY p.pay_date DESC, p.created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results || [];
}

export async function getPayrollById(db: any, id: number): Promise<PayrollWithEmployee | null> {
  const query = `
    SELECT 
      p.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.employee_id as employee_code,
      d.name as department_name,
      e.position
    FROM payroll p
    INNER JOIN employees e ON p.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE p.id = ?
  `;

  const result = await db.prepare(query).bind(id).first();
  return result || null;
}

export async function createPayroll(db: any, payroll: Payroll): Promise<number> {
  const query = `
    INSERT INTO payroll (
      employee_id, pay_period_start, pay_period_end, pay_date,
      base_salary, bonuses, deductions, tax, net_salary,
      status, payment_method, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await db.prepare(query).bind(
    payroll.employee_id,
    payroll.pay_period_start,
    payroll.pay_period_end,
    payroll.pay_date,
    payroll.base_salary,
    payroll.bonuses || 0,
    payroll.deductions || 0,
    payroll.tax || 0,
    payroll.net_salary,
    payroll.status,
    payroll.payment_method || null,
    payroll.notes || null,
    payroll.created_by || null
  ).run();

  return result.meta.last_row_id;
}

export async function updatePayroll(db: any, id: number, payroll: Partial<Payroll>): Promise<boolean> {
  const updates: string[] = [];
  const bindings: any[] = [];

  if (payroll.pay_period_start) {
    updates.push('pay_period_start = ?');
    bindings.push(payroll.pay_period_start);
  }

  if (payroll.pay_period_end) {
    updates.push('pay_period_end = ?');
    bindings.push(payroll.pay_period_end);
  }

  if (payroll.pay_date) {
    updates.push('pay_date = ?');
    bindings.push(payroll.pay_date);
  }

  if (payroll.base_salary !== undefined) {
    updates.push('base_salary = ?');
    bindings.push(payroll.base_salary);
  }

  if (payroll.bonuses !== undefined) {
    updates.push('bonuses = ?');
    bindings.push(payroll.bonuses);
  }

  if (payroll.deductions !== undefined) {
    updates.push('deductions = ?');
    bindings.push(payroll.deductions);
  }

  if (payroll.tax !== undefined) {
    updates.push('tax = ?');
    bindings.push(payroll.tax);
  }

  if (payroll.net_salary !== undefined) {
    updates.push('net_salary = ?');
    bindings.push(payroll.net_salary);
  }

  if (payroll.status) {
    updates.push('status = ?');
    bindings.push(payroll.status);
  }

  if (payroll.payment_method !== undefined) {
    updates.push('payment_method = ?');
    bindings.push(payroll.payment_method);
  }

  if (payroll.notes !== undefined) {
    updates.push('notes = ?');
    bindings.push(payroll.notes);
  }

  if (payroll.approved_by !== undefined) {
    updates.push('approved_by = ?');
    bindings.push(payroll.approved_by);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  const query = `UPDATE payroll SET ${updates.join(', ')} WHERE id = ?`;
  const result = await db.prepare(query).bind(...bindings).run();

  return result.success;
}

export async function deletePayroll(db: any, id: number): Promise<boolean> {
  const query = `DELETE FROM payroll WHERE id = ?`;
  const result = await db.prepare(query).bind(id).run();
  return result.success;
}

export async function getPayrollStats(db: any, filters?: { pay_period?: string }) {
  let query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(base_salary) as total_base_salary,
      SUM(bonuses) as total_bonuses,
      SUM(deductions) as total_deductions,
      SUM(tax) as total_tax,
      SUM(net_salary) as total_net_salary
    FROM payroll
  `;

  const bindings: any[] = [];

  if (filters?.pay_period) {
    query += ` WHERE (pay_period_start <= ? AND pay_period_end >= ?)`;
    bindings.push(filters.pay_period, filters.pay_period);
  }

  const result = await db.prepare(query).bind(...bindings).first();
  return result;
}

export async function generateBulkPayroll(db: any, payPeriod: { start: string; end: string; payDate: string }): Promise<number> {
  // Get all active employees
  const employees = await db.prepare(`
    SELECT id, base_salary FROM employees WHERE status = 'active'
  `).all();

  let created = 0;

  for (const emp of employees.results || []) {
    const baseSalary = emp.base_salary || 0;
    const tax = baseSalary * 0.1; // 10% tax
    const netSalary = baseSalary - tax;

    await createPayroll(db, {
      employee_id: emp.id,
      pay_period_start: payPeriod.start,
      pay_period_end: payPeriod.end,
      pay_date: payPeriod.payDate,
      base_salary: baseSalary,
      bonuses: 0,
      deductions: 0,
      tax,
      net_salary: netSalary,
      status: 'draft'
    });

    created++;
  }

  return created;
}

// ===========================================
// AUTHENTICATION FUNCTIONS
// ===========================================

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  employee_id?: number;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id?: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Get user by username
export async function getUserByUsername(db: any, username: string): Promise<User | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
      .bind(username)
      .first();
    return result || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Create new session
export async function createSession(
  db: any,
  userId: number,
  sessionToken: string,
  expiresAt: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Session | null> {
  try {
    const result = await db
      .prepare(
        'INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, sessionToken, expiresAt, ipAddress || null, userAgent || null)
      .run();

    if (result.success) {
      // Update last login
      await db
        .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(userId)
        .run();

      return {
        id: result.meta.last_row_id,
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      };
    }
    return null;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

// Get session by token
export async function getSessionByToken(db: any, sessionToken: string): Promise<Session | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP')
      .bind(sessionToken)
      .first();
    return result || null;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

// Delete session (logout)
export async function deleteSession(db: any, sessionToken: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('DELETE FROM sessions WHERE session_token = ?')
      .bind(sessionToken)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

// Delete all sessions for a user
export async function deleteAllUserSessions(db: any, userId: number): Promise<boolean> {
  try {
    const result = await db
      .prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(userId)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error deleting user sessions:', error);
    return false;
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(db: any): Promise<number> {
  try {
    const result = await db
      .prepare('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP')
      .run();
    return result.meta.changes || 0;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }
}

// Get user with session validation
export async function getUserFromSession(db: any, sessionToken: string): Promise<User | null> {
  try {
    const session = await getSessionByToken(db, sessionToken);
    if (!session) return null;

    const user = await db
      .prepare('SELECT id, username, email, full_name, role, employee_id, is_active, last_login FROM users WHERE id = ? AND is_active = 1')
      .bind(session.user_id)
      .first();

    return user || null;
  } catch (error) {
    console.error('Error fetching user from session:', error);
    return null;
  }
}

// Password Reset Token Management

export interface PasswordResetToken {
  id?: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: boolean;
  created_at?: string;
}

export async function createPasswordResetToken(
  db: any,
  userId: number,
  token: string,
  expiresAt: string
): Promise<number | null> {
  try {
    const result = await db
      .prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
      .bind(userId, token, expiresAt)
      .run();
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return null;
  }
}

export async function getPasswordResetToken(db: any, token: string): Promise<PasswordResetToken | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP')
      .bind(token)
      .first();
    return result || null;
  } catch (error) {
    console.error('Error fetching password reset token:', error);
    return null;
  }
}

export async function markPasswordResetTokenAsUsed(db: any, token: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?')
      .bind(token)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error marking token as used:', error);
    return false;
  }
}

export async function deletePasswordResetToken(db: any, token: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('DELETE FROM password_reset_tokens WHERE token = ?')
      .bind(token)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error deleting password reset token:', error);
    return false;
  }
}

// User Registration and Management

export async function getUserByEmail(db: any, email: string): Promise<User | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    return result || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function createUser(
  db: any,
  userData: {
    username: string;
    password_hash: string;
    email: string;
    full_name: string;
    role?: string;
    employee_id?: number;
  }
): Promise<number | null> {
  try {
    const result = await db
      .prepare(
        'INSERT INTO users (username, password_hash, email, full_name, role, employee_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
      )
      .bind(
        userData.username,
        userData.password_hash,
        userData.email,
        userData.full_name,
        userData.role || 'employee',
        userData.employee_id || null
      )
      .run();
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function updateUserPassword(db: any, userId: number, passwordHash: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE users SET password_hash = ?, last_password_change = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(passwordHash, userId)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error updating user password:', error);
    return false;
  }
}

export async function updateUserProfile(
  db: any,
  userId: number,
  updates: {
    full_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  }
): Promise<boolean> {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(updates.full_name);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.profile_image !== undefined) {
      fields.push('profile_image = ?');
      values.push(updates.profile_image);
    }

    if (fields.length === 0) return false;

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);

    const result = await db.prepare(query).bind(...values).run();
    return result.success;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

export async function incrementFailedLoginAttempts(db: any, userId: number): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?')
      .bind(userId)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error incrementing failed login attempts:', error);
    return false;
  }
}

export async function resetFailedLoginAttempts(db: any, userId: number): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?')
      .bind(userId)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error resetting failed login attempts:', error);
    return false;
  }
}

export async function lockUserAccount(db: any, userId: number, lockUntil: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE users SET locked_until = ? WHERE id = ?')
      .bind(lockUntil, userId)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error locking user account:', error);
    return false;
  }
}

// User Permissions

export interface UserPermission {
  id?: number;
  user_id: number;
  permission_name: string;
  granted_by?: number;
  granted_at?: string;
}

export async function getUserPermissions(db: any, userId: number): Promise<string[]> {
  try {
    const result = await db
      .prepare('SELECT permission_name FROM user_permissions WHERE user_id = ?')
      .bind(userId)
      .all();
    return (result.results || []).map((row: any) => row.permission_name);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

export async function grantPermission(
  db: any,
  userId: number,
  permissionName: string,
  grantedBy: number
): Promise<boolean> {
  try {
    const result = await db
      .prepare('INSERT OR REPLACE INTO user_permissions (user_id, permission_name, granted_by) VALUES (?, ?, ?)')
      .bind(userId, permissionName, grantedBy)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error granting permission:', error);
    return false;
  }
}

export async function revokePermission(db: any, userId: number, permissionName: string): Promise<boolean> {
  try {
    const result = await db
      .prepare('DELETE FROM user_permissions WHERE user_id = ? AND permission_name = ?')
      .bind(userId, permissionName)
      .run();
    return result.success;
  } catch (error) {
    console.error('Error revoking permission:', error);
    return false;
  }
}

// User Audit Log

export interface AuditLogEntry {
  id?: number;
  user_id?: number;
  action: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export async function createAuditLog(
  db: any,
  logEntry: {
    user_id?: number;
    action: string;
    description?: string;
    ip_address?: string;
    user_agent?: string;
  }
): Promise<number | null> {
  try {
    const result = await db
      .prepare(
        'INSERT INTO user_audit_log (user_id, action, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        logEntry.user_id || null,
        logEntry.action,
        logEntry.description || null,
        logEntry.ip_address || null,
        logEntry.user_agent || null
      )
      .run();
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
}

export async function getUserAuditLogs(
  db: any,
  userId: number,
  limit = 50,
  offset = 0
): Promise<AuditLogEntry[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM user_audit_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(userId, limit, offset)
      .all();
    return result.results || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}
