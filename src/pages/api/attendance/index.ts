// API endpoint for attendance operations
import type { APIRoute } from 'astro';
import {
  getAllAttendance,
  createAttendance,
  deleteAttendance,
  getAttendanceStats,
  type Attendance
} from '../../../lib/db';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query parameters for filtering
    const date = url.searchParams.get('date') || undefined;
    const employeeId = url.searchParams.get('employee_id');
    const status = url.searchParams.get('status') || undefined;
    const statsOnly = url.searchParams.get('stats') === 'true';

    // Return stats if requested
    if (statsOnly) {
      const stats = await getAttendanceStats(db, date);
      return new Response(JSON.stringify({
        success: true,
        data: stats
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filters = {
      date,
      employee_id: employeeId ? parseInt(employeeId) : undefined,
      status
    };

    const attendance = await getAllAttendance(db, filters);

    return new Response(JSON.stringify({
      success: true,
      data: attendance
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch attendance records'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;
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
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();

    if (!body.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await deleteAttendance(db, body.id);

    if (!success) {
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
