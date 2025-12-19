import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
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

    const userId = sessionUser.id;
    const today = new Date().toISOString().split('T')[0];

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

    // Find today's attendance record
    const attendance = await db
      .prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ? AND clock_out IS NULL')
      .bind(user.employee_id, today)
      .first();

    if (!attendance) {
      return new Response(
        JSON.stringify({ error: 'No active clock-in found for today' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get notes from request body
    const body = await request.json().catch(() => ({})) as { notes?: string };
    const notes = body.notes || '';

    // Format time as HH:MM:SS
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const clockOutTime = `${hours}:${minutes}:${seconds}`;

    // Calculate working hours using Date objects for accurate timezone handling
    const clockIn = attendance.clock_in as string;
    const [inHours, inMinutes, inSeconds] = clockIn.split(':').map(Number);
    const [outHours, outMinutes, outSeconds] = clockOutTime.split(':').map(Number);

    const clockInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), inHours, inMinutes, inSeconds || 0);
    const clockOutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), outHours, outMinutes, outSeconds || 0);

    const totalMinutes = Math.floor((clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60));
    const workingHours = Math.floor(totalMinutes / 60);
    const workingMinutes = totalMinutes % 60;
    const workingHoursFormatted = `${workingHours}h ${workingMinutes}m`;

    // Update existing notes with clock-out notes if provided
    let updatedNotes = attendance.notes || '';
    if (notes) {
      updatedNotes = updatedNotes ? `${updatedNotes} | Clock-out: ${notes}` : `Clock-out: ${notes}`;
    }

    // Update attendance record
    await db
      .prepare(`
        UPDATE attendance 
        SET clock_out = ?, working_hours = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(clockOutTime, workingHoursFormatted, updatedNotes, attendance.id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Clocked out successfully',
        data: {
          id: attendance.id,
          date: today,
          clock_in: clockIn,
          clock_out: clockOutTime,
          working_hours: workingHoursFormatted,
          total_minutes: totalMinutes
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Clock-out error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

