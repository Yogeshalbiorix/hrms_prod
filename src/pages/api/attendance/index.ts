// API endpoint for attendance operations
import type { APIRoute } from 'astro';
import {
  getAllAttendance,
  createAttendance,
  deleteAttendance,
  getAttendanceStats,
  type Attendance
} from '../../../lib/db';
import { getDB } from '../../../lib/db';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    // Get query parameters for filtering
    const date = url.searchParams.get('date') || undefined;
    const employeeId = url.searchParams.get('employee_id');
    const status = url.searchParams.get('status') || undefined;
    const statsOnly = url.searchParams.get('stats') === 'true';

    // Return stats if requested (from actual attendance table)
    if (statsOnly) {
      let statsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT employee_id) as total_employees,
          SUM(CASE WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN clock_in IS NULL AND clock_out IS NULL THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status = 'late' OR notes LIKE '%Late%' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN status = 'half-day' THEN 1 ELSE 0 END) as half_day,
          SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) as on_leave
        FROM attendance
      `;

      const bindings: any[] = [];
      if (date) {
        statsQuery += ` WHERE date = ?`;
        bindings.push(date);
      }

      const stats = await db.prepare(statsQuery).bind(...bindings).first();

      return new Response(JSON.stringify({
        success: true,
        data: stats
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch attendance records from actual attendance table
    let query = `
      SELECT 
        a.id,
        a.employee_id,
        a.date as attendance_date,
        a.clock_in as check_in_time,
        a.clock_out as check_out_time,
        a.working_hours,
        a.status,
        a.work_mode,
        a.notes,
        a.location,
        (e.first_name || ' ' || e.last_name) as employee_name,
        e.employee_id as employee_code,
        d.name as department_name
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    if (date) {
      query += ` AND a.date = ?`;
      bindings.push(date);
    }

    if (employeeId) {
      query += ` AND a.employee_id = ?`;
      bindings.push(parseInt(employeeId));
    }

    if (status) {
      query += ` AND a.status = ?`;
      bindings.push(status);
    }

    query += ` ORDER BY a.date DESC, a.clock_in DESC LIMIT 100`;

    const result = await db.prepare(query).bind(...bindings).all();

    return new Response(JSON.stringify({
      success: true,
      data: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch attendance records',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json() as any;

    // Validate required fields
    if (!body.employee_id || !body.attendance_date || !body.status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: employee_id, attendance_date, status'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attendance: Attendance = {
      employee_id: body.employee_id,
      attendance_date: body.attendance_date,
      check_in_time: body.check_in_time,
      check_out_time: body.check_out_time,
      status: body.status,
      notes: body.notes
    };

    const id = await createAttendance(db, attendance);

    return new Response(JSON.stringify({
      success: true,
      data: { id },
      message: 'Attendance record created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create attendance record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json() as { id: number };

    if (!body.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from attendance table
    const result = await db.prepare('DELETE FROM attendance WHERE id = ?').bind(body.id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Attendance record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Attendance record deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete attendance record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

