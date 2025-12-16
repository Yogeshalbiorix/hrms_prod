/**
 * API Endpoint for Work From Home requests
 */
import type { APIRoute } from 'astro';
import { sendActivityEmail } from '../../../lib/email-service';

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

    const body = await request.json();
    const { employee_id, date, reason } = body;

    // Validate required fields
    if (!employee_id || !date) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: employee_id, date'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert work from home request
    const result = await db.prepare(`
      INSERT INTO work_from_home_requests (employee_id, date, reason, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `).bind(employee_id, date, reason || '').run();

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
          'work_from_home',
          {
            date,
            reason: reason || 'No reason provided'
          }
        ).catch(err => console.error('Failed to send WFH email:', err));
      }
    } catch (emailError) {
      console.error('Error sending WFH notification email:', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Work from home request submitted successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creating work from home request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create work from home request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

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

    const employeeId = url.searchParams.get('employee_id');

    let query = `
      SELECT w.*, e.first_name, e.last_name, e.emp_code
      FROM work_from_home_requests w
      JOIN employees e ON w.employee_id = e.id
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' WHERE w.employee_id = ?';
      params.push(parseInt(employeeId));
    }

    query += ' ORDER BY w.created_at DESC';

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
    console.error('Error fetching work from home requests:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch work from home requests'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
