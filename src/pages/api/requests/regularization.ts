/**
 * API Endpoint for Attendance Regularization requests
 */
import type { APIRoute } from 'astro';
import { sendActivityEmail } from '../../../lib/email-service';
import { getDB, getUserFromSession } from '../../../lib/db';

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
    const { employee_id, date, clock_in, clock_out, reason } = body;

    console.log('Regularization request payload:', body);

    // Validate required fields
    if (!employee_id || !date || !clock_in || !clock_out) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: employee_id, date, clock_in, clock_out'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert regularization request
    const result = await db.prepare(`
      INSERT INTO regularization_requests (employee_id, date, clock_in, clock_out, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(employee_id, date, clock_in, clock_out, reason || '').run();

    // Get employee details for email notification
    try {
      const employee = await db.prepare(
        'SELECT email, first_name, last_name FROM employees WHERE id = ?'
      ).bind(employee_id).first();

      if (employee && employee.email) {
        const userName = `${employee.first_name} ${employee.last_name}`;

        // Send email notification asynchronously
        sendActivityEmail(
          employee.email,
          userName,
          'regularization',
          {
            date,
            clock_in,
            clock_out,
            reason: reason || 'No reason provided'
          }
        ).catch(err => console.error('Failed to send regularization email:', err));
      }
    } catch (emailError) {
      console.error('Error sending regularization notification email:', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Attendance regularization request submitted successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creating regularization request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create regularization request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ locals, url }) => {
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

    const employeeId = url.searchParams.get('employee_id');

    let query = `
      SELECT r.*, e.first_name, e.last_name, e.emp_code
      FROM regularization_requests r
      JOIN employees e ON r.employee_id = e.id
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' WHERE r.employee_id = ?';
      params.push(parseInt(employeeId));
    }

    query += ' ORDER BY r.created_at DESC';

    const stmt = params.length > 0
      ? db.prepare(query).bind(...params)
      : db.prepare(query);

    const { results } = await stmt.all();

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching regularization requests:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch regularization requests'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

