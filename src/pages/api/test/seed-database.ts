// API endpoint to seed the database with sample data
import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime?.env);

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if data already exists
    const existingEmployees = await db.prepare('SELECT COUNT(*) as count FROM employees').first() as { count: number } | null;

    if (existingEmployees && existingEmployees.count > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: `Database already has ${existingEmployees.count} employees. No seeding needed.`,
        count: existingEmployees.count
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First, create departments
    await db.prepare(`
      INSERT OR IGNORE INTO departments (name, description, created_at)
      VALUES 
        ('Engineering', 'Software Development and IT', CURRENT_TIMESTAMP),
        ('Sales', 'Sales and Business Development', CURRENT_TIMESTAMP),
        ('Human Resources', 'HR and Employee Relations', CURRENT_TIMESTAMP),
        ('Finance', 'Accounting and Financial Management', CURRENT_TIMESTAMP),
        ('Operations', 'Operations and Support', CURRENT_TIMESTAMP)
    `).run();

    // Insert sample employees
    await db.prepare(`
      INSERT INTO employees (
        employee_id, first_name, last_name, email, phone,
        department_id, position, employment_type, status, join_date, base_salary
      ) VALUES
      ('EMP001', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '+1-234-567-8901', 1, 'Senior Developer', 'full-time', 'active', '2022-01-15', 85000.00),
      ('EMP002', 'Michael', 'Chen', 'michael.chen@company.com', '+1-234-567-8902', 2, 'Sales Manager', 'full-time', 'active', '2021-06-20', 72000.00),
      ('EMP003', 'Emily', 'Rodriguez', 'emily.rodriguez@company.com', '+1-234-567-8903', 3, 'HR Specialist', 'full-time', 'active', '2023-03-10', 68000.00),
      ('EMP004', 'David', 'Kim', 'david.kim@company.com', '+1-234-567-8904', 4, 'Financial Analyst', 'full-time', 'active', '2022-09-05', 75000.00),
      ('EMP005', 'Jessica', 'Brown', 'jessica.brown@company.com', '+1-234-567-8905', 5, 'Operations Lead', 'full-time', 'active', '2021-11-18', 78000.00),
      ('EMP006', 'James', 'Wilson', 'james.wilson@company.com', '+1-234-567-8906', 1, 'Frontend Developer', 'full-time', 'active', '2023-02-20', 70000.00),
      ('EMP007', 'Maria', 'Garcia', 'maria.garcia@company.com', '+1-234-567-8907', 2, 'Sales Executive', 'full-time', 'active', '2023-05-15', 65000.00),
      ('EMP008', 'Robert', 'Taylor', 'robert.taylor@company.com', '+1-234-567-8908', 3, 'Recruiter', 'full-time', 'active', '2022-08-10', 62000.00),
      ('EMP009', 'Lisa', 'Anderson', 'lisa.anderson@company.com', '+1-234-567-8909', 4, 'Accountant', 'full-time', 'active', '2023-01-05', 68000.00),
      ('EMP010', 'Thomas', 'Martinez', 'thomas.martinez@company.com', '+1-234-567-8910', 5, 'Support Specialist', 'full-time', 'active', '2023-04-12', 55000.00)
    `).run();

    // Insert today's attendance records
    const today = new Date().toISOString().split('T')[0];

    await db.prepare(`
      INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, work_mode)
      VALUES
        (1, '${today}', '08:45:00', NULL, 'present', 'office'),
        (2, '${today}', '08:50:00', NULL, 'present', 'office'),
        (3, '${today}', '08:40:00', NULL, 'present', 'office'),
        (4, '${today}', '08:35:00', NULL, 'present', 'office'),
        (5, '${today}', '09:05:00', NULL, 'late', 'office'),
        (6, '${today}', '08:55:00', NULL, 'present', 'remote'),
        (7, '${today}', '08:30:00', NULL, 'present', 'office'),
        (8, '${today}', NULL, NULL, 'on-leave', NULL)
    `).run();

    // Insert some leave requests
    await db.prepare(`
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status)
      VALUES
        (8, 'sick', '${today}', '${today}', 1, 'Medical appointment', 'approved'),
        (3, 'vacation', '2024-12-25', '2024-12-27', 3, 'Holiday break', 'pending')
    `).run();

    // Verify the data
    const employeeCount = await db.prepare('SELECT COUNT(*) as count FROM employees').first() as { count: number };
    const departmentCount = await db.prepare('SELECT COUNT(*) as count FROM departments').first() as { count: number };
    const attendanceCount = await db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ?').bind(today).first() as { count: number };

    return new Response(JSON.stringify({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        employees: employeeCount.count,
        departments: departmentCount.count,
        attendance_records: attendanceCount.count,
        date: today
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database seed error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed database'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime?.env);

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check database status
    const employeeCount = await db.prepare('SELECT COUNT(*) as count FROM employees').first() as { count: number } | null;
    const departmentCount = await db.prepare('SELECT COUNT(*) as count FROM departments').first() as { count: number } | null;
    const today = new Date().toISOString().split('T')[0];
    const attendanceCount = await db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ?').bind(today).first() as { count: number } | null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        employees: employeeCount?.count || 0,
        departments: departmentCount?.count || 0,
        attendance_today: attendanceCount?.count || 0,
        needs_seeding: (employeeCount?.count || 0) === 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check database status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
