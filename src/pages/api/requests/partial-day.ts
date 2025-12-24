/**
 * API Endpoint for Partial Day requests (Cloudflare compatible)
 */

import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';
import { sendEmail } from '../../../lib/email-service';

/* ---------------------------------------------------
   Helper: Send Partial Day email via Centralized Service
--------------------------------------------------- */
async function sendPartialDayEmail(
  to: string,
  userName: string,
  data: {
    date: string;
    start_time: string;
    end_time: string;
    duration: number;
    reason: string;
  }
) {
  const subject = '⏰ Partial Day Request Submitted - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>

    <p>Your <strong>Partial Day</strong> request has been submitted successfully.</p>

    <p><b>Date:</b> ${data.date}</p>
    <p><b>Time:</b> ${data.start_time} – ${data.end_time}</p>
    <p><b>Duration:</b> ${data.duration} hour(s)</p>
    <p><b>Reason:</b> ${data.reason || 'No reason provided'}</p>

    <p>Status: <strong>Pending Approval</strong></p>

    <p>Regards,<br/><strong>HRMS Team</strong></p>
  `;

  await sendEmail({
    to,
    subject,
    html,
    to_name: userName
  });
}

/* ---------------------------------------------------
   POST: Create partial day request
--------------------------------------------------- */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) return json(500, { error: 'Database not configured' });

    const body = await request.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const {
      employee_id,
      date,
      start_time,
      end_time,
      duration,
      reason
    } = body;

    if (!employee_id || !date || !start_time || !end_time) {
      return json(400, {
        error: 'Missing required fields: employee_id, date, start_time, end_time'
      });
    }

    const result = await db.prepare(`
      INSERT INTO partial_day_requests
      (employee_id, date, start_time, end_time, duration, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `)
      .bind(
        employee_id,
        date,
        start_time,
        end_time,
        duration || 0,
        reason || ''
      )
      .run();

    /* ---------------------------------------------------
       Email notification (non-blocking)
    --------------------------------------------------- */
    try {
      const employee = await db
        .prepare('SELECT email, first_name, last_name FROM employees WHERE id = ?')
        .bind(employee_id)
        .first();

      if (employee?.email) {
        sendPartialDayEmail(
          employee.email,
          `${employee.first_name} ${employee.last_name}`,
          {
            date,
            start_time,
            end_time,
            duration: duration || 0,
            reason: reason || 'No reason provided'
          }
        ).catch(console.error);
      }
    } catch (emailErr) {
      console.error('Partial day email error:', emailErr);
    }

    return json(201, {
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Partial day request submitted successfully'
    });
  } catch (error: any) {
    console.error('Error creating partial day request:', error);
    return json(500, {
      error: error.message || 'Failed to create partial day request'
    });
  }
};

/* ---------------------------------------------------
   GET: List partial day requests
--------------------------------------------------- */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) return json(500, { error: 'Database not configured' });

    const employeeId = url.searchParams.get('employee_id');

    let query = `
      SELECT p.*, e.first_name, e.last_name, e.emp_code
      FROM partial_day_requests p
      JOIN employees e ON p.employee_id = e.id
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' WHERE p.employee_id = ?';
      params.push(Number(employeeId));
    }

    query += ' ORDER BY p.created_at DESC';

    const stmt =
      params.length > 0
        ? db.prepare(query).bind(...params)
        : db.prepare(query);

    const { results } = await stmt.all();

    return json(200, { success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching partial day requests:', error);
    return json(500, {
      error: error.message || 'Failed to fetch partial day requests'
    });
  }
};

/* ---------------------------------------------------
   Helper
--------------------------------------------------- */
function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
