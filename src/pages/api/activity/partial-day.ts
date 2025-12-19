import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json() as any;
    const { date, start_time, end_time, reason } = body;

    if (!date || !start_time || !end_time) {
      return new Response(JSON.stringify({ error: 'Date, start time, and end time are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate duration in hours
    const [startHours, startMinutes] = start_time.split(':').map(Number);
    const [endHours, endMinutes] = end_time.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = (durationMinutes / 60).toFixed(2);

    // Insert partial day request
    const result = await db
      .prepare(`
        INSERT INTO partial_day_requests (employee_id, date, start_time, end_time, duration, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `)
      .bind(user.employee_id, date, start_time, end_time, durationHours, reason || null)
      .run();

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
