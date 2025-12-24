// API endpoint for leave management operations (Cloudflare compatible)

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
import { sendEmail } from '../../../lib/email-service';

/* ---------------------------------------------------
   Helper: Send Leave Request Email via Centralized Service
--------------------------------------------------- */
async function sendLeaveRequestEmail(
  to: string,
  userName: string,
  leave: Leave
) {
  const subject = '📩 New Leave Request Submitted - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your leave request has been submitted successfully.</p>

    <p><b>Leave Type:</b> ${leave.leave_type}</p>
    <p><b>Start Date:</b> ${leave.start_date}</p>
    <p><b>End Date:</b> ${leave.end_date}</p>
    <p><b>Total Days:</b> ${leave.total_days}</p>

    ${leave.reason ? `<p><b>Reason:</b> ${leave.reason}</p>` : ''}

    <p>Status: <strong>${leave.status}</strong></p>

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
   GET: List leaves / stats
--------------------------------------------------- */
export const GET: APIRoute = async ({ request, locals, url }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const token = request.headers
      .get('Authorization')
      ?.replace('Bearer ', '');

    if (!token) return json(401, { error: 'Unauthorized' });

    const user = await getUserFromSession(db, token);
    if (!user) return json(401, { error: 'Invalid session' });

    if (url.searchParams.get('stats') === 'true') {
      const stats = await getLeaveStats(db);
      return json(200, { success: true, data: stats });
    }

    const filters = {
      employee_id: url.searchParams.get('employee_id')
        ? Number(url.searchParams.get('employee_id'))
        : undefined,
      status: url.searchParams.get('status') || undefined,
      leave_type: url.searchParams.get('leave_type') || undefined
    };

    const leaves = await getAllLeaves(db, filters);
    return json(200, { success: true, data: leaves });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Failed to fetch leaves' });
  }
};

/* ---------------------------------------------------
   POST: Create leave + email notification
--------------------------------------------------- */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const token = request.headers
      .get('Authorization')
      ?.replace('Bearer ', '');

    if (!token) return json(401, { error: 'Unauthorized' });

    const user = await getUserFromSession(db, token);
    if (!user) return json(401, { error: 'Invalid session' });

    const body = await request.json();

    if (!body.employee_id || !body.leave_type || !body.start_date || !body.end_date) {
      return json(400, { error: 'Missing required fields' });
    }

    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    const totalDays =
      Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;

    const leave: Leave = {
      employee_id: Number(body.employee_id),
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      total_days: totalDays,
      reason: body.reason,
      status: 'pending',
      notes: body.notes
    };

    const id = await createLeave(db, leave, false);
    if (!id) return json(500, { error: 'Failed to create leave' });

    // Email notification (non-blocking)
    try {
      const emp = await db
        .prepare('SELECT email, first_name, last_name FROM employees WHERE id = ?')
        .bind(leave.employee_id)
        .first();

      if (emp?.email) {
        sendLeaveRequestEmail(
          emp.email,
          `${emp.first_name} ${emp.last_name}`,
          leave
        ).catch(console.error);
      }
    } catch (e) {
      console.error('Email error:', e);
    }

    return json(201, {
      success: true,
      data: { id },
      message: 'Leave request created successfully'
    });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Failed to create leave request' });
  }
};

/* ---------------------------------------------------
   DELETE: Delete leave
--------------------------------------------------- */
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const token = request.headers
      .get('Authorization')
      ?.replace('Bearer ', '');

    if (!token) return json(401, { error: 'Unauthorized' });

    const user = await getUserFromSession(db, token);
    if (!user) return json(401, { error: 'Invalid session' });

    const { id } = await request.json();
    if (!id) return json(400, { error: 'Missing id' });

    const ok = await deleteLeave(db, id);
    if (!ok) return json(404, { error: 'Leave not found' });

    return json(200, { success: true, message: 'Leave deleted successfully' });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Failed to delete leave' });
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
