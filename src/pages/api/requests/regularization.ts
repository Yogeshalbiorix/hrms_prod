/**
 * API Endpoint for Attendance Regularization requests
 * Cloudflare Pages compatible
 */

import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';
import { sendEmail } from '../../../lib/email-service';

/* ---------------------------------------------------
   Helper: Send regularization email via Centralized Service
--------------------------------------------------- */
async function sendRegularizationEmail(
  to: string,
  userName: string,
  data: {
    date: string;
    clock_in: string;
    clock_out: string;
    reason: string;
  }
) {
  const subject = '📝 Attendance Regularization Request - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>

    <p>Your <strong>attendance regularization request</strong> has been submitted.</p>

    <p><b>Date:</b> ${data.date}</p>
    <p><b>Clock In:</b> ${data.clock_in}</p>
    <p><b>Clock Out:</b> ${data.clock_out}</p>
    <p><b>Reason:</b> ${data.reason}</p>

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
   POST: Create regularization request
--------------------------------------------------- */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) return json(500, { error: 'Database not configured' });

    // Auth
    const token = request.headers
      .get('Authorization')
      ?.replace('Bearer ', '');

    if (!token) return json(401, { error: 'Unauthorized - No session token' });

    const sessionUser = await getUserFromSession(db, token);
    if (!sessionUser) return json(401, { error: 'Unauthorized - Invalid session' });

    const body = await request.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const { employee_id, date, clock_in, clock_out, reason } = body;

    if (!employee_id || !date || !clock_in || !clock_out) {
      return json(400, {
        error: 'Missing required fields: employee_id, date, clock_in, clock_out'
      });
    }

    const result = await db.prepare(`
      INSERT INTO regularization_requests
      (employee_id, date, clock_in, clock_out, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `)
      .bind(employee_id, date, clock_in, clock_out, reason || '')
      .run();

    // Email notification (non-blocking)
    try {
      const employee = await db
        .prepare('SELECT email, first_name, last_name FROM employees WHERE id = ?')
        .bind(employee_id)
        .first();

      if (employee?.email) {
        sendRegularizationEmail(
          employee.email,
          `${employee.first_name} ${employee.last_name}`,
          {
            date,
            clock_in,
            clock_out,
            reason: reason || 'No reason provided'
          }
        ).catch(console.error);
      }
    } catch (emailErr) {
      console.error('Regularization email error:', emailErr);
    }

    return json(201, {
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Attendance regularization request submitted successfully'
    });
  } catch (error: any) {
    console.error('Error creating regularization request:', error);
    return json(500, {
      error: error.message || 'Failed to create regularization request'
    });
  }
};

/* ---------------------------------------------------
   GET: List regularization requests
--------------------------------------------------- */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) return json(500, { error: 'Database not configured' });

    const employeeId = url.searchParams.get('employee_id');

    let query = `
      SELECT r.*, e.first_name, e.last_name, e.emp_code
      FROM regularization_requests r
      JOIN employees e ON r.employee_id = e.id
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' WHERE r.employee_id = ?';
      params.push(Number(employeeId));
    }

    query += ' ORDER BY r.created_at DESC';

    const stmt =
      params.length > 0
        ? db.prepare(query).bind(...params)
        : db.prepare(query);

    const { results } = await stmt.all();

    return json(200, { success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching regularization requests:', error);
    return json(500, {
      error: error.message || 'Failed to fetch regularization requests'
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
