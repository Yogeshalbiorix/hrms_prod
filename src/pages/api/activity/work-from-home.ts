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
    const { dates, reason, request_type = 'full', start_time, end_time } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one date is required' }), { status: 400 });
    }

    // POLICY CHECKS
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Quarter Limit (2 days per quarter)
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const quarterStart = new Date(currentYear, currentQuarter * 3, 1).toISOString().split('T')[0];
    const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0).toISOString().split('T')[0];

    // Count existing WFH requests in this quarter
    const wfhCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM work_from_home_requests 
      WHERE employee_id = ? 
      AND date BETWEEN ? AND ? 
      AND status != 'rejected'
    `).bind(user.employee_id, quarterStart, quarterEnd).first();

    const wfhCount = wfhCountResult?.count || 0;

    // Calculate new days being requested
    const newDaysCount = dates.length; // Assuming each date is 1 "hit" to the limit for now, regardless of full/half

    if (wfhCount + newDaysCount > 2) {
      return new Response(JSON.stringify({
        error: `Policy Check Failed: You have already used ${wfhCount} WFH days this quarter. Limit is 2 days/quarter.`
      }), { status: 400 });
    }

    // 2. Iterate and Validate each date
    const insertedIds: number[] = [];
    const minNoticeDate = new Date(today);
    minNoticeDate.setDate(today.getDate() + 1); // Tomorrow

    const maxPastDate = new Date(today);
    maxPastDate.setMonth(today.getMonth() - 1); // 1 month ago

    for (const dateStr of dates) {
      const requestDate = new Date(dateStr);
      requestDate.setHours(0, 0, 0, 0);

      // Past Window Check (1 month)
      if (requestDate < maxPastDate) {
        return new Response(JSON.stringify({
          error: `Policy Check Failed: Date ${dateStr} is older than 1 month.`
        }), { status: 400 });
      }

      // Notice Period Check (1 day prior notice for future dates)
      // Policy says "1 day prior notice".
      // If date is today, it's NOT prior notice. Date must be >= minNoticeDate (Tomorrow).
      // However, if it's a PAST date (allowed by 1 month window policy), notice period doesn't apply logically?
      // "WFH request requires 1 day(s) of prior notice" usually implies for PLANNED leave. 
      // User also says "allowed to raise WFH request for past 1 month".
      // So if date >= today, apply notice check? 
      // Let's assume: If Future Date => Must be at least tomorrow. If Past Date => Allowed.

      const isFutureOrToday = requestDate >= today;
      if (isFutureOrToday && requestDate < minNoticeDate) {
        return new Response(JSON.stringify({
          error: `Policy Check Failed: Future WFH requests require 1 day prior notice.`
        }), { status: 400 });
      }

      // Insert Request
      const result = await db.prepare(`
          INSERT INTO work_from_home_requests (
            employee_id, date, reason, status, request_type, start_time, end_time
          ) VALUES (?, ?, ?, 'pending', ?, ?, ?)
        `)
        .bind(
          user.employee_id,
          dateStr,
          reason || null,
          request_type,
          start_time || null,
          end_time || null
        )
        .run();

      if (result.meta?.last_row_id) {
        insertedIds.push(result.meta.last_row_id);
      }
    }

    // 3. Send Email Notification
    try {
      if (user.email) {
        const { sendEmail } = await import('../../../lib/email-service');
        const emailHtml = `
          <p>Hello ${user.first_name},</p>
          <p>Your Work From Home request has been submitted successfully.</p>
          <p><b>Dates:</b> ${dates.join(', ')}</p>
          <p><b>Type:</b> ${request_type.toUpperCase()}</p>
          <p><b>Status:</b> Pending Approval</p>
        `;
        await sendEmail({
          to: user.email,
          subject: 'WFH Request Submitted',
          html: emailHtml
        });
      }
    } catch (e) {
      console.error('Failed to send WFH submission email', e);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Work from home requests submitted successfully',
      data: { ids: insertedIds }
    }), { status: 201 });

  } catch (error) {
    console.error('Work from home request error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to submit work from home request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
};

// GET - Fetch work from home requests for the logged-in user
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
          id, date, reason, status, notes, 
          created_at, approval_date
        FROM work_from_home_requests
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
    console.error('Fetch WFH requests error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch work from home requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
