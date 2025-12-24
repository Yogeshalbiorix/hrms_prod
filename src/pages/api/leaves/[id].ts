// API endpoint for individual leave record operations (Cloudflare compatible)

import type { APIRoute } from 'astro';
import {
  getLeaveById,
  updateLeave,
  type Leave,
  getDB,
  getUserFromSession
} from '../../../lib/db';
import { sendEmail } from '../../../lib/email-service';

/* ---------------------------------------------------
   Helper: Send Leave Status Email via Centralized Service
--------------------------------------------------- */
async function sendLeaveStatusEmail(
  to: string,
  userName: string,
  status: 'approved' | 'rejected',
  data: any
) {
  const subject =
    status === 'approved'
      ? '✅ Leave Request Approved - HRMS'
      : '❌ Leave Request Rejected - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>

    <p>Your leave request has been
      <strong>${status.toUpperCase()}</strong>.
    </p>

    <p><b>Leave Type:</b> ${data.leave_type}</p>
    <p><b>Period:</b> ${data.start_date} → ${data.end_date}</p>
    <p><b>Total Days:</b> ${data.total_days}</p>

    ${status === 'approved'
      ? `<p><b>Approved By:</b> ${data.approved_by}</p>`
      : `<p><b>Rejection Reason:</b> ${data.rejection_reason || 'N/A'}</p>`
    }

    <p style="margin-top:16px;">
      Regards,<br/>
      <strong>HRMS Team</strong>
    </p>
  `;

  await sendEmail({
    to,
    subject,
    html,
    to_name: userName
  });
}

/* ---------------------------------------------------
   GET: Fetch single leave record
--------------------------------------------------- */
export const GET: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return json(401, { error: 'Unauthorized - No session token' });
    }

    const sessionUser = await getUserFromSession(db, sessionToken);
    if (!sessionUser) {
      return json(401, { error: 'Unauthorized - Invalid session' });
    }

    const id = Number(params.id);
    if (!id) {
      return json(400, { error: 'Invalid leave ID' });
    }

    const leave = await getLeaveById(db, id);
    if (!leave) {
      return json(404, { error: 'Leave record not found' });
    }

    return json(200, { success: true, data: leave });
  } catch (error) {
    console.error('Error fetching leave:', error);
    return json(500, { error: 'Failed to fetch leave record' });
  }
};

/* ---------------------------------------------------
   PUT: Update leave + send approval/rejection email
--------------------------------------------------- */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return json(401, { error: 'Unauthorized - No session token' });
    }

    const sessionUser = await getUserFromSession(db, sessionToken);
    if (!sessionUser) {
      return json(401, { error: 'Unauthorized - Invalid session' });
    }

    const id = Number(params.id);
    if (!id) {
      return json(400, { error: 'Invalid leave ID' });
    }

    const body = await request.json();

    // Calculate total days
    let totalDays = body.total_days;
    if (body.start_date && body.end_date) {
      const start = new Date(body.start_date);
      const end = new Date(body.end_date);
      totalDays =
        Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
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

    const updated = await updateLeave(db, id, leave);
    if (!updated) {
      return json(404, { error: 'Leave record not found' });
    }

    /* ---------- Send Email if Approved / Rejected ---------- */
    if (body.status === 'approved' || body.status === 'rejected') {
      try {
        const leaveDetails = await db.prepare(`
          SELECT l.*, e.email, e.first_name, e.last_name
          FROM leaves l
          JOIN employees e ON l.employee_id = e.id
          WHERE l.id = ?
        `).bind(id).first();

        if (leaveDetails?.email) {
          const userName =
            `${leaveDetails.first_name} ${leaveDetails.last_name}`;

          await sendLeaveStatusEmail(
            leaveDetails.email,
            userName,
            body.status,
            {
              leave_type: leaveDetails.leave_type,
              start_date: leaveDetails.start_date,
              end_date: leaveDetails.end_date,
              total_days: leaveDetails.total_days,
              approved_by: body.approved_by || 'Manager',
              rejection_reason: body.rejection_reason || body.notes
            }
          );
        }
      } catch (emailErr) {
        console.error('Leave status email failed:', emailErr);
        // Do NOT fail API if email fails
      }
    }

    return json(200, {
      success: true,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    return json(500, { error: 'Failed to update leave request' });
  }
};

/* ---------------------------------------------------
   Helper: JSON response
--------------------------------------------------- */
function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
