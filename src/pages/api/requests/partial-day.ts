/**
 * API Endpoint for Partial Day requests
 */
import type { APIRoute } from 'astro';
import { sendActivityEmail } from '../../../lib/email-service';
import { getDB } from '../../../lib/db';

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

    const body = await request.json();
    const { employee_id, date, start_time, end_time, duration, reason } = body;

    // Validate required fields
    if (!employee_id || !date || !start_time || !end_time) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: employee_id, date, start_time, end_time'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert partial day request
    const result = await db.prepare(`
      INSERT INTO partial_day_requests (employee_id, date, start_time, end_time, duration, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(employee_id, date, start_time, end_time, duration || 0, reason || '').run();

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
          'partial_day',
          {
            date,
            start_time,
            end_time,
            duration: duration || 'N/A',
            reason: reason || 'No reason provided'
          }
        ).catch(err => console.error('Failed to send partial day email:', err));
      }
    } catch (emailError) {
      console.error('Error sending partial day notification email:', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Partial day request submitted successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creating partial day request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create partial day request'
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
      SELECT p.*, e.first_name, e.last_name, e.emp_code
      FROM partial_day_requests p
      JOIN employees e ON p.employee_id = e.id
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' WHERE p.employee_id = ?';
      params.push(parseInt(employeeId));
    }

    query += ' ORDER BY p.created_at DESC';

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
    console.error('Error fetching partial day requests:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch partial day requests'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

