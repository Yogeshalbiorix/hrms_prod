// API endpoint for leave management operations
import type { APIRoute } from 'astro';
import {
  getAllLeaves,
  createLeave,
  deleteLeave,
  getLeaveStats,
  type Leave
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
    const employeeId = url.searchParams.get('employee_id');
    const status = url.searchParams.get('status') || undefined;
    const leaveType = url.searchParams.get('leave_type') || undefined;
    const statsOnly = url.searchParams.get('stats') === 'true';

    // Return stats if requested
    if (statsOnly) {
      const stats = await getLeaveStats(db);
      return new Response(JSON.stringify({
        success: true,
        data: stats
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filters = {
      employee_id: employeeId ? parseInt(employeeId) : undefined,
      status,
      leave_type: leaveType
    };

    const leaves = await getAllLeaves(db, filters);

    return new Response(JSON.stringify({
      success: true,
      data: leaves
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch leave records'
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
    if (!body.employee_id || !body.leave_type || !body.start_date || !body.end_date) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: employee_id, leave_type, start_date, end_date'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate total days
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leave: Leave = {
      employee_id: body.employee_id,
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      total_days: totalDays,
      reason: body.reason,
      status: body.status || 'pending',
      notes: body.notes
    };

    const id = await createLeave(db, leave);

    return new Response(JSON.stringify({
      success: true,
      data: { id },
      message: 'Leave request created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating leave:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create leave request'
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

    const success = await deleteLeave(db, body.id);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Leave record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Leave request deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting leave:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete leave request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
