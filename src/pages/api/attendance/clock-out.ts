import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime.env);

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

    const clockOutTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    // Calculate working hours
    const clockIn = attendance.clock_in as string;
    const clockInParts = clockIn.split(':');
    const clockOutParts = clockOutTime.split(':');

    const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
    const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);

    const totalMinutes = clockOutMinutes - clockInMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const workingHours = `${hours}h ${minutes}m`;

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
      .bind(clockOutTime, workingHours, updatedNotes, attendance.id)
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
          working_hours: workingHours,
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
