// Diagnostic endpoint to check database status
import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime?.env);

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured',
        env_check: {
          has_runtime: !!locals.runtime,
          has_runtime_env: !!locals.runtime?.env,
          has_DB_binding: !!locals.runtime?.env?.DB
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check tables exist
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();

    // Count records in each key table
    const employeeCount = await db.prepare('SELECT COUNT(*) as count FROM employees').first() as { count: number } | null;
    const departmentCount = await db.prepare('SELECT COUNT(*) as count FROM departments').first() as { count: number } | null;
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first() as { count: number } | null;

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const attendanceCount = await db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ?').bind(today).first() as { count: number } | null;

    // Sample a few employees to verify data
    const sampleEmployees = await db.prepare('SELECT id, employee_id, first_name, last_name, email, status FROM employees LIMIT 5').all();

    // Sample departments
    const sampleDepartments = await db.prepare('SELECT id, name FROM departments LIMIT 5').all();

    return new Response(JSON.stringify({
      success: true,
      database_status: 'Connected',
      tables: tables.results?.map((t: any) => t.name) || [],
      counts: {
        employees: employeeCount?.count || 0,
        departments: departmentCount?.count || 0,
        users: userCount?.count || 0,
        attendance_today: attendanceCount?.count || 0
      },
      samples: {
        employees: sampleEmployees.results || [],
        departments: sampleDepartments.results || []
      },
      needs_seeding: (employeeCount?.count || 0) === 0,
      today_date: today
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database diagnostic error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Database check failed',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
