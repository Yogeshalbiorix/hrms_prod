import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
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

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const userId = sessionUser.id;

    // Get user's employee info
    const user = await db
      .prepare('SELECT employee_id, role FROM users WHERE id = ?')
      .bind(userId)
      .first();

    // If admin user or no employee_id, return empty data
    if (!user?.employee_id) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            records: [],
            today: null,
            statistics: {
              total_days: 0,
              present_days: 0,
              average_hours: '0h 0m',
              on_time_percentage: 100,
              total_working_minutes: 0
            }
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get attendance records
    const allRecords = await db
      .prepare(`
        SELECT * FROM attendance 
        WHERE employee_id = ? 
        ORDER BY date DESC, clock_in ASC
      `)
      .bind(user.employee_id)
      .all();

    // Group sessions by date
    const dateMap = new Map<string, any>();

    // Check if results exist
    if (!allRecords.results || allRecords.results.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            records: [],
            today: null,
            statistics: {
              total_days: 0,
              present_days: 0,
              average_hours: '0h 0m',
              on_time_percentage: 100,
              total_working_minutes: 0
            }
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    allRecords.results.forEach((record: any) => {
      const date = record.date;

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date: date,
          sessions: [],
          total_minutes: 0,
          first_clock_in: null,
          last_clock_out: null,
          has_active_session: false,
          status: record.status,
          work_mode: record.work_mode
        });
      }

      const group = dateMap.get(date);
      group.sessions.push({
        id: record.id,
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        working_hours: record.working_hours,
        notes: record.notes,
        location: record.location
      });

      if (!group.first_clock_in) {
        group.first_clock_in = record.clock_in;
      }
      if (record.clock_out) {
        group.last_clock_out = record.clock_out;
      } else {
        group.has_active_session = true;
      }

      // Calculate total minutes
      if (record.working_hours) {
        const match = record.working_hours.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          group.total_minutes += parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    });

    // Convert map to array and format
    const groupedRecords: any[] = [];
    dateMap.forEach((group) => {
      groupedRecords.push({
        date: group.date,
        clock_in: group.first_clock_in,
        clock_out: group.has_active_session ? null : group.last_clock_out,
        working_hours: group.total_minutes > 0 ? `${Math.floor(group.total_minutes / 60)}h ${group.total_minutes % 60}m` : null,
        session_count: group.sessions.length,
        sessions: group.sessions,
        status: group.status,
        work_mode: group.work_mode,
        has_active_session: group.has_active_session,
        total_minutes: group.total_minutes
      });
    });

    const records = groupedRecords.slice(0, days);

    // Get today's record
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === today) || null;

    // Calculate statistics
    const presentDays = records.filter((r: any) => r.status === 'present').length;
    const totalMinutes = records.reduce((sum: number, r: any) => {
      return sum + (r.total_minutes || 0);
    }, 0);

    const avgMinutesPerDay = presentDays > 0 ? Math.floor(totalMinutes / presentDays) : 0;
    const avgHours = Math.floor(avgMinutesPerDay / 60);
    const avgMins = avgMinutesPerDay % 60;

    // Calculate on-time percentage
    const lateCount = records.filter((r: any) =>
      r.sessions.some((s: any) => s.notes && s.notes.includes('Late by'))
    ).length;
    const onTimePercentage = presentDays > 0 ?
      Math.round(((presentDays - lateCount) / presentDays) * 100) : 100;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records: records,
          today: todayRecord,
          statistics: {
            total_days: records.length,
            present_days: presentDays,
            average_hours: `${avgHours}h ${avgMins}m`,
            on_time_percentage: onTimePercentage,
            total_working_minutes: totalMinutes
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get attendance error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
