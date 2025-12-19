// API endpoint for individual leave record operations
import type { APIRoute } from 'astro';
import {
  getLeaveById,
  updateLeave,
  type Leave,
  getDB,
  getUserFromSession
} from '../../../lib/db';
import { sendActivityEmail } from '../../../lib/email-service';

export const GET: APIRoute = async ({ request, params, locals }) => {
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

    const id = parseInt(params.id || '0');
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid leave ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const leave = await getLeaveById(db, id);

    if (!leave) {
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
      data: leave
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch leave record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    const id = parseInt(params.id || '0');
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid leave ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;

    // Recalculate total days if dates changed
    let totalDays = body.total_days;
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const leave: Partial<Leave> = {
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      total_days: totalDays,
      reason: body.reason,
      status: body.status,
      approved_by: body.approved_by,
      approval_date: body.approval_date,
      notes: body.notes,
      rejection_reason: body.rejection_reason
    };

    const success = await updateLeave(db, id, leave);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Leave record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send email notification if status changed to approved or rejected
    if (body.status === 'approved' || body.status === 'rejected') {
      try {
        // Get leave details with employee info
        const leaveDetails = await db.prepare(`
          SELECT l.*, e.email, e.first_name, e.last_name 
          FROM leaves l
          JOIN employees e ON l.employee_id = e.id
          WHERE l.id = ?
        `).bind(id).first();

        if (leaveDetails && leaveDetails.email) {
          const userName = `${leaveDetails.first_name} ${leaveDetails.last_name}`;
          const activityType = body.status === 'approved' ? 'leave_approval' : 'leave_rejection';

          // Send email notification asynchronously
          sendActivityEmail(
            leaveDetails.email,
            userName,
            activityType,
            {
              leave_type: leaveDetails.leave_type,
              start_date: leaveDetails.start_date,
              end_date: leaveDetails.end_date,
              total_days: leaveDetails.total_days,
              approved_by: body.approved_by || 'Manager',
              rejection_reason: body.rejection_reason || body.notes
            }
          ).catch(err => console.error('Failed to send leave status email:', err));
        }
      } catch (emailError) {
        console.error('Error sending leave status notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Leave request updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update leave request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
