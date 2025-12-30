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

    const body = await request.json() as { work_mode?: string; notes?: string; latitude?: number; longitude?: number; location_address?: string };
    const { work_mode = 'office', notes = '', latitude, longitude, location_address } = body;

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

    // Check if already clocked in today (without clock out)
    const existing = await db
      .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1')
      .bind(userId, today)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Already clocked in. Please clock out first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use IST for all time calculations
    const now = new Date();
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    // Format time as HH:MM:SS in IST
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');
    const clockInTime = `${hours}:${minutes}:${seconds}`;

    if (!user?.employee_id) {
      return new Response(
        JSON.stringify({ error: 'Employee record not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if late (office hours: 10:30 AM IST)
    const clockInHour = parseInt(hours, 10);
    const clockInMinute = parseInt(minutes, 10);
    const expectedTime = 10 * 60 + 30; // 10:30 AM in minutes
    const actualTime = clockInHour * 60 + clockInMinute;
    const lateMinutes = Math.max(0, actualTime - expectedTime);
    const isLate = lateMinutes > 0;

    // Prepare location data
    const locationData = latitude && longitude ?
      JSON.stringify({
        latitude,
        longitude,
        address: location_address || 'Unknown',
        timestamp: now.toISOString()
      }) : null;

    // Prepare notes
    let finalNotes = '';
    if (notes) {
      finalNotes = notes;
    }
    if (isLate) {
      const lateNote = `Late by ${lateMinutes} minutes`;
      finalNotes = finalNotes ? `${finalNotes} | ${lateNote}` : lateNote;
    }

    // Insert attendance record
    const result = await db
      .prepare(`
        INSERT INTO attendance (
          employee_id, user_id, date, clock_in, work_mode, status, notes, location, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        user.employee_id,
        userId,
        today,
        clockInTime,
        work_mode,
        'present',
        finalNotes,
        locationData,
        now.toISOString()
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Clocked in successfully',
        data: {
          id: result.meta.last_row_id,
          date: today,
          clock_in: clockInTime,
          work_mode,
          is_late: isLate,
          late_minutes: lateMinutes,
          location: locationData ? JSON.parse(locationData) : null
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Clock-in error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

