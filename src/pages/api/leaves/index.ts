// API endpoint for leave management operations
import type { APIRoute } from 'astro';
import {
  getAllLeaves,
  createLeave,
  deleteLeave,
  getLeaveStats,
  type Leave,
  getDB,
  getUserFromSession
} from '../../../lib/db';
import { sendActivityEmail } from '../../../lib/email-service';

export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate session and get user
    const sessionUser = await getUserFromSession(db, sessionToken);

    if (!sessionUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
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
    const db = getDB(locals.runtime?.env || locals.env);

    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate session and get user
    const sessionUser = await getUserFromSession(db, sessionToken);

    if (!sessionUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as any;

    console.log('Leave request payload:', body);
    console.log('Session user:', sessionUser);

    // Validate required fields
    if (!body.employee_id || !body.leave_type || !body.start_date || !body.end_date) {
      console.error('Missing required fields:', { body });
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: employee_id, leave_type, start_date, end_date'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify employee_id is a valid number
    const employeeId = parseInt(String(body.employee_id));
    if (isNaN(employeeId) || employeeId <= 0) {
      console.error('Invalid employee_id:', body.employee_id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid employee ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate total days
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date format:', { start_date: body.start_date, end_date: body.end_date });
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid date format. Expected YYYY-MM-DD'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (endDate < startDate) {
      console.error('End date is before start date:', { start_date: body.start_date, end_date: body.end_date });
      return new Response(JSON.stringify({
        success: false,
        error: 'End date must be after or equal to start date'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Validate leave_type
    const validLeaveTypes = ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'unpaid'];
    if (!validLeaveTypes.includes(body.leave_type)) {
      console.error('Invalid leave type:', body.leave_type);
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid leave type. Must be one of: ${validLeaveTypes.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const leave: Leave = {
      employee_id: employeeId,
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      total_days: totalDays,
      reason: body.reason,
      status: body.status || 'pending',
      notes: body.notes
    };

    console.log('Creating leave with data:', leave);

    const id = await createLeave(db, leave, false);

    if (!id) {
      console.error('Failed to create leave - no ID returned');
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create leave record in database'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Leave created successfully with ID:', id);

    // Get employee details for email notification
    try {
      const employee = await db.prepare(
        'SELECT email, first_name, last_name FROM employees WHERE id = ?'
      ).bind(body.employee_id).first();

      if (employee && employee.email) {
        const userName = `${employee.first_name} ${employee.last_name}`;

        // Send email notification asynchronously (don't block response)
        sendActivityEmail(
          employee.email,
          userName,
          'leave_request',
          {
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            total_days: leave.total_days,
            reason: leave.reason,
            status: leave.status
          }
        ).catch(err => console.error('Failed to send leave request email:', err));
      }
    } catch (emailError) {
      console.error('Error sending leave notification email:', emailError);
      // Don't fail the request if email fails
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create leave request',
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate session and get user
    const sessionUser = await getUserFromSession(db, sessionToken);

    if (!sessionUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

