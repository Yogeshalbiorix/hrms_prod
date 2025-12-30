import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const user = await getUserFromSession(db, sessionToken);
    if (!user || !user.employee_id) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const body = await request.json() as any;
    const { date, start_time, end_time, reason } = body;

    if (!date || !start_time || !end_time) {
      return new Response(JSON.stringify({ error: 'Date, start time, and end time are required' }), { status: 400 });
    }

    // POLICY CHECKS
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Notice Period Check
    // "Partial day request cannot be made sooner than 1 day(s)."
    // "You are allowed to request for past dated partial work day."
    // Interpretation: Future dates need 1 day notice. Past dates are allowed.
    const minNoticeDate = new Date(today);
    minNoticeDate.setDate(today.getDate() + 1); // Tomorrow

    if (requestDate >= today && requestDate < minNoticeDate) {
      return new Response(JSON.stringify({
        error: `Policy Check Failed: Future Partial Day requests require 1 day prior notice.`
      }), { status: 400 });
    }

    // 2. 500 Minutes Limit Check
    const [startH, startM] = start_time.split(':').map(Number);
    const [endH, endM] = end_time.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const newDurationMinutes = endTotal - startTotal;

    if (newDurationMinutes <= 0) {
      return new Response(JSON.stringify({ error: 'End time must be after start time' }), { status: 400 });
    }

    // Get current month start/end
    const currentYear = requestDate.getFullYear();
    const currentMonth = requestDate.getMonth();
    const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    // Sum existing partial day durations (in hours) for this month
    const durationSumResult = await db.prepare(`
      SELECT SUM(duration) as total_hours FROM partial_day_requests 
      WHERE employee_id = ? 
      AND date BETWEEN ? AND ? 
      AND status != 'rejected'
    `).bind(user.employee_id, monthStart, monthEnd).first();

    const existingHours = durationSumResult?.total_hours || 0;
    const existingMinutes = existingHours * 60;

    if (existingMinutes + newDurationMinutes > 500) {
      return new Response(JSON.stringify({
        error: `Policy Check Failed: Monthly limit of 500 minutes exceeded. Used: ${Math.round(existingMinutes)}m, Requested: ${newDurationMinutes}m.`
      }), { status: 400 });
    }

    const durationHours = (newDurationMinutes / 60).toFixed(2);

    // Insert partial day request
    const result = await db
      .prepare(`
        INSERT INTO partial_day_requests (employee_id, date, start_time, end_time, duration, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `)
      .bind(user.employee_id, date, start_time, end_time, durationHours, reason || null)
      .run();

    // Send Email
    try {
      if (user.email) {
        const { sendEmail } = await import('../../../lib/email-service');
        const emailHtml = `
          <p>Hello ${user.first_name},</p>
          <p>Your Partial Day Request has been submitted successfully.</p>
          <p><b>Date:</b> ${date}</p>
          <p><b>Time:</b> ${start_time} - ${end_time} (${newDurationMinutes} mins)</p>
          <p><b>Status:</b> Pending Approval</p>
        `;
        await sendEmail({
          to: user.email,
          subject: 'Partial Day Request Submitted',
          html: emailHtml
        });
      }
    } catch (e) {
      console.error('Failed to send partial day email', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Partial day request submitted successfully',
        data: { id: result.meta.last_row_id, duration: durationHours }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Partial day request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to submit partial day request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET - Fetch partial day requests for the logged-in user
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserFromSession(db, sessionToken);
    if (!user || !user.employee_id) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requests = await db
      .prepare(`
        SELECT 
          id, date, start_time, end_time, duration, reason, status, notes,
          created_at, approval_date
        FROM partial_day_requests
        WHERE employee_id = ?
        ORDER BY date DESC
        LIMIT 50
      `)
      .bind(user.employee_id)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        data: requests.results || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fetch partial day requests error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch partial day requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
