/**
 * API Endpoint for Work From Home requests (Cloudflare compatible)
 */

import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';
import { sendEmail } from '../../../lib/email-service';

/* ---------------------------------------------------
   Helper: Send WFH email via Centralized Service
--------------------------------------------------- */
async function sendWFHEmail(
  to: string,
  userName: string,
  date: string,
  reason: string
) {
  const subject = '🏠 Work From Home Request Submitted - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>

    <p>Your <strong>Work From Home</strong> request has been submitted.</p>

    <p><b>Date:</b> ${date}</p>
    <p><b>Reason:</b> ${reason || 'No reason provided'}</p>

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
   POST: Create WFH request
--------------------------------------------------- */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) return json(500, { error: 'Database not configured' });

    const body = await request.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const { employee_id, date, reason } = body;

    if (!employee_id || !date) {
      return json(400, {
        error: 'Missing required fields: employee_id, date'
      });
    }

    const result = await db.prepare(`
      INSERT INTO work_from_home_requests
      (employee_id, date, reason, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `)
      .bind(employee_id, date, reason || '')
      .run();

    // Send email notification (non-blocking)
    try {
      const employee = await db
        .prepare('SELECT email, first_name, last_name FROM employees WHERE id = ?')
        .bind(employee_id)
        .first();

      if (employee?.email) {
        sendWFHEmail(
          employee.email,
          `${employee.first_name} ${employee.last_name}`,
          date,
          reason || 'No reason provided'
        ).catch(console.error);
      }
    } catch (emailErr) {
      console.error('WFH email error:', emailErr);
    }

    return json(201, {
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Work from home request submitted successfully'
    });
  } catch (error: any) {
    console.error('Error creating WFH request:', error);
    return json(500, {
      error: error.message || 'Failed to create work from home request'
    });
  }
};

/* ---------------------------------------------------
   GET: List WFH requests
--------------------------------------------------- */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) return json(500, { error: 'Database not configured' });

    const employeeId = url.searchParams.get('employee_id');

    let query = `
      SELECT w.*, e.first_name, e.last_name, e.emp_code
      FROM work_from_home_requests w
      JOIN employees e ON w.employee_id = e.id
    `;

    const params: any[] = [];

    if (employeeId) {
      query += ' WHERE w.employee_id = ?';
      params.push(Number(employeeId));
    }

    query += ' ORDER BY w.created_at DESC';

    const stmt =
      params.length > 0
        ? db.prepare(query).bind(...params)
        : db.prepare(query);

    const { results } = await stmt.all();

    return json(200, { success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching WFH requests:', error);
    return json(500, {
      error: error.message || 'Failed to fetch work from home requests'
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
