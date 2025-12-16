// API endpoint for employee attendance details
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals, url }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const employeeId = parseInt(params.id || '0');
    const days = parseInt(url.searchParams.get('days') || '30');

    if (!employeeId || isNaN(employeeId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid employee ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get employee basic info
    const employee = await db
      .prepare(`
        SELECT 
          e.id,
          e.employee_id as emp_code,
          e.first_name,
          e.last_name,
          e.email,
          e.position,
          d.name as department
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = ?
      `)
      .bind(employeeId)
      .first();

    if (!employee) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Employee not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get attendance records
    const attendanceRecords = await db
      .prepare(`
        SELECT 
          a.*
        FROM attendance a
        WHERE a.employee_id = ?
          AND a.date >= date('now', '-' || ? || ' days')
        ORDER BY a.date DESC, a.clock_in ASC
      `)
      .bind(employeeId, days)
      .all();

    // Group attendance by date
    const attendanceByDate: any[] = [];
    const dateMap = new Map<string, any>();

    (attendanceRecords.results || []).forEach((record: any) => {
      if (!dateMap.has(record.date)) {
        dateMap.set(record.date, {
          date: record.date,
          sessions: [],
          total_minutes: 0,
          first_clock_in: null,
          last_clock_out: null,
          has_active_session: false
        });
      }

      const group = dateMap.get(record.date);
      group.sessions.push({
        id: record.id,
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        working_hours: record.working_hours,
        notes: record.notes,
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

    dateMap.forEach((group) => {
      const hours = Math.floor(group.total_minutes / 60);
      const minutes = group.total_minutes % 60;
      group.total_working_hours = `${hours}h ${minutes}m`;
      group.session_count = group.sessions.length;
      attendanceByDate.push(group);
    });

    // Get leave requests
    const leaveRequests = await db
      .prepare(`
        SELECT 
          id,
          leave_type,
          start_date,
          end_date,
          total_days,
          reason,
          status,
          approved_by,
          created_at
        FROM employee_leave_history
        WHERE employee_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .bind(employeeId)
      .all();

    // Calculate statistics
    const totalDays = attendanceByDate.length;
    const totalMinutes = attendanceByDate.reduce((sum, day) => sum + day.total_minutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMinutesRemainder = totalMinutes % 60;
    const averageMinutesPerDay = totalDays > 0 ? totalMinutes / totalDays : 0;
    const avgHours = Math.floor(averageMinutesPerDay / 60);
    const avgMinutes = Math.round(averageMinutesPerDay % 60);

    // Count late and absent days
    const lateCount = attendanceByDate.filter(day => {
      if (!day.first_clock_in) return false;
      const clockInTime = day.first_clock_in.split(':');
      const hour = parseInt(clockInTime[0]);
      const minute = parseInt(clockInTime[1]);
      return hour > 9 || (hour === 9 && minute > 15); // Late after 9:15 AM
    }).length;

    const absentCount = days - totalDays; // Simple calculation

    const employeeDetails = {
      employee_id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      emp_code: employee.emp_code,
      email: employee.email,
      position: employee.position,
      department: employee.department || 'N/A',
      attendance_records: attendanceByDate,
      leave_requests: leaveRequests.results || [],
      total_attendance_days: totalDays,
      total_working_hours: `${totalHours}h ${totalMinutesRemainder}m`,
      average_hours_per_day: `${avgHours}h ${avgMinutes}m`,
      late_count: lateCount,
      absent_count: absentCount
    };

    return new Response(JSON.stringify({
      success: true,
      data: employeeDetails
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching employee attendance details:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch employee attendance details',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
