// API endpoint to sync users table to employees table
import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find users without employee records
    const usersWithoutEmployees = await db.prepare(`
      SELECT 
        u.id as user_id,
        u.email,
        u.full_name,
        u.role
      FROM users u
      LEFT JOIN employees e ON u.email = e.email
      WHERE e.id IS NULL
    `).all();

    if (!usersWithoutEmployees.results || usersWithoutEmployees.results.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All users already have employee records',
        synced: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create employee records for each user
    const insertPromises = usersWithoutEmployees.results.map(async (user: any) => {
      const employeeId = `EMP${String(user.user_id).padStart(5, '0')}`;

      // Split full_name into first_name and last_name
      const nameParts = user.full_name.trim().split(' ');
      const firstName = nameParts[0] || user.full_name;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Determine position based on role
      let position = 'Employee';
      if (user.role === 'admin') position = 'Administrator';
      else if (user.role === 'hr') position = 'HR Manager';
      else if (user.role === 'manager') position = 'Manager';

      const query = `
        INSERT INTO employees (
          employee_id, first_name, last_name, email, position,
          employment_type, status, join_date, department_id,
          base_salary, currency, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
      `;

      return db.prepare(query).bind(
        employeeId,
        firstName,
        lastName,
        1, // Default department
        50000, // Default salary
        'USD',
        'system',
        'system'
      ).run();
    });

    await Promise.all(insertPromises);

    // Verify sync
    const verification = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM employees) as total_employees,
        (SELECT COUNT(*) FROM users u 
         INNER JOIN employees e ON u.email = e.email) as synced_records
    `).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Users synced to employees successfully',
      synced: usersWithoutEmployees.results.length,
      verification
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error syncing users to employees:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to sync users to employees',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check sync status
    const status = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM employees) as total_employees,
        (SELECT COUNT(*) FROM users u 
         LEFT JOIN employees e ON u.email = e.email
         WHERE e.id IS NULL) as unsynced_users
    `).first();

    return new Response(JSON.stringify({
      success: true,
      data: status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking sync status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check sync status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

