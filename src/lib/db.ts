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

export async function createEmployee(db: any, employee: Employee): Promise<{ id: number; employee_id: string }> {
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
  
  const result = await db.prepare(query).bind(
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
  ).run();
  
  return {
    id: result.meta.last_row_id,
    employee_id: employeeId
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

export async function createDepartment(db: any, department: Department): Promise<number> {
  const query = `
    INSERT INTO departments (name, description, manager_id)
    VALUES (?, ?, ?)
  `;
  
  // Helper function to convert empty strings to null
  const toNull = (value: any) => {
    if (value === '' || value === undefined) return null;
    return value;
  };
  
  const result = await db.prepare(query).bind(
    department.name,
    toNull(department.description),
    toNull(department.manager_id)
  ).run();
  
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
