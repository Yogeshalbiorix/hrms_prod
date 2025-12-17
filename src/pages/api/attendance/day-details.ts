import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate session and get user
    const sessionUser = await getUserFromSession(db, sessionToken);

    if (!sessionUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const userId = sessionUser.id;

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's employee info
    const user = await db
      .prepare('SELECT employee_id FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user?.employee_id) {
      return new Response(
        JSON.stringify({ error: 'Employee record not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all attendance entries for the date (including multiple clock-in/out)
    const entries = await db
      .prepare(`
        SELECT * FROM attendance 
        WHERE employee_id = ? AND date = ?
        ORDER BY clock_in ASC
      `)
      .bind(user.employee_id, date)
      .all();

    // Calculate total working time
    let totalMinutes = 0;
    entries.results.forEach((entry: any) => {
      if (entry.working_hours) {
        const match = entry.working_hours.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          date,
          entries: entries.results,
          total_working_hours: `${totalHours}h ${totalMins}m`,
          total_minutes: totalMinutes,
          entry_count: entries.results.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get attendance details error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

