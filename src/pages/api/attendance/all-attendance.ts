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

    if (!sessionUser || sessionUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const employeeId = url.searchParams.get('employee_id');

    // Build query to get all attendance sessions
    let query = `
      SELECT 
        a.*,
        e.first_name,
        e.last_name,
        e.employee_id as emp_code,
        e.position,
        u.username,
        u.email
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.date >= date('now', '-' || ? || ' days')
    `;

    const params: any[] = [days];

    if (employeeId) {
      query += ` AND e.id = ?`;
      params.push(parseInt(employeeId));
    }

    query += ` ORDER BY a.date DESC, a.clock_in ASC`;

    const allRecords = await db
      .prepare(query)
      .bind(...params)
      .all();

    // Group sessions by employee and date
    const groupedData: any[] = [];
    const dateEmployeeMap = new Map<string, any>();

    allRecords.results.forEach((record: any) => {
      const key = `${record.employee_id}_${record.date}`;

      if (!dateEmployeeMap.has(key)) {
        dateEmployeeMap.set(key, {
          employee_id: record.employee_id,
          date: record.date,
          first_name: record.first_name,
          last_name: record.last_name,
          emp_code: record.emp_code,
          position: record.position,
          username: record.username,
          email: record.email,
          sessions: [],
          total_minutes: 0,
          first_clock_in: null,
          last_clock_out: null,
          has_active_session: false
        });
      }

      const group = dateEmployeeMap.get(key);
      group.sessions.push({
        id: record.id,
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        working_hours: record.working_hours,
        notes: record.notes,
        location: record.location,
        status: record.status
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
    dateEmployeeMap.forEach((group) => {
      groupedData.push({
        ...group,
        total_working_hours: `${Math.floor(group.total_minutes / 60)}h ${group.total_minutes % 60}m`,
        session_count: group.sessions.length
      });
    });

    const records = groupedData;

    // Calculate statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT a.employee_id) as total_employees,
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.notes LIKE '%Late%' THEN 1 ELSE 0 END) as late_count
      FROM attendance a
      WHERE a.date >= date('now', '-${days} days')
    `;

    const stats = await db.prepare(statsQuery).first();

    // Get today's active sessions
    const today = new Date().toISOString().split('T')[0];
    const activeSessions = await db
      .prepare(`
        SELECT 
          a.*,
          e.first_name,
          e.last_name,
          e.employee_id as emp_code
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE a.date = ? AND a.clock_out IS NULL
        ORDER BY a.clock_in DESC
      `)
      .bind(today)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records: (records as any).results || records,
          statistics: stats,
          active_sessions: (activeSessions as any).results || activeSessions,
          filters: {
            days,
            employee_id: employeeId
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get all attendance error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

