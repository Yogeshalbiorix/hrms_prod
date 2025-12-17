import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    // Get all employees
    const employees = await db.prepare('SELECT id FROM employees LIMIT 5').all();

    if (!employees.results || employees.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No employees found. Please create employees first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const insertedRecords = [];

    // Insert attendance records for the last 30 days for each employee
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      for (const employee of employees.results as any[]) {
        // Random clock in time between 8:00 and 9:30
        const clockInHour = 8 + Math.floor(Math.random() * 2);
        const clockInMinute = Math.floor(Math.random() * 60);
        const clockInTime = `${dateStr}T${clockInHour.toString().padStart(2, '0')}:${clockInMinute.toString().padStart(2, '0')}:00Z`;

        // Random clock out time between 17:00 and 18:30 (8-9 hours later)
        const clockOutHour = 17 + Math.floor(Math.random() * 2);
        const clockOutMinute = Math.floor(Math.random() * 60);
        const clockOutTime = `${dateStr}T${clockOutHour.toString().padStart(2, '0')}:${clockOutMinute.toString().padStart(2, '0')}:00Z`;

        // Calculate working hours
        const clockIn = new Date(clockInTime);
        const clockOut = new Date(clockOutTime);
        const diffMs = clockOut.getTime() - clockIn.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const workingHours = `${diffHours}h ${diffMinutes}m`;

        // Determine status (90% present, 5% late, 5% absent)
        const rand = Math.random();
        let status = 'present';
        let notes = null;
        let actualClockOut: string | null = clockOutTime;

        if (rand < 0.05) {
          status = 'absent';
          actualClockOut = null;
          notes = 'Absent';
        } else if (rand < 0.10) {
          status = 'late';
          notes = 'Late arrival';
        }

        try {
          await db.prepare(`
            INSERT INTO attendance (employee_id, user_id, date, clock_in, clock_out, working_hours, status, notes, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
            .bind(
              employee.id,
              employee.id,
              dateStr,
              clockInTime,
              actualClockOut,
              status === 'absent' ? null : workingHours,
              status,
              notes,
              'Office'
            )
            .run();

          insertedRecords.push({
            employee_id: employee.id,
            date: dateStr,
            status
          });
        } catch (err) {
          console.error(`Error inserting attendance for employee ${employee.id} on ${dateStr}:`, err);
        }
      }
    }

    // Insert some leave requests
    const leaveTypes = ['sick', 'vacation', 'personal'];
    const leaveStatuses = ['pending', 'approved', 'rejected'];

    for (const employee of employees.results as any[]) {
      // Create 2-3 leave requests per employee
      const leaveCount = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < leaveCount; i++) {
        const startDayOffset = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDayOffset);
        const startDateStr = startDate.toISOString().split('T')[0];

        const duration = 1 + Math.floor(Math.random() * 4); // 1-4 days
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const status = leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)];
        const reason = leaveType === 'sick' ? 'Not feeling well' :
          leaveType === 'vacation' ? 'Family vacation' :
            'Personal reasons';

        try {
          await db.prepare(`
            INSERT INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
            .bind(
              employee.id,
              leaveType,
              startDateStr,
              endDateStr,
              duration,
              reason,
              status
            )
            .run();
        } catch (err) {
          console.error(`Error inserting leave for employee ${employee.id}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully seeded attendance and leave data`,
        data: {
          attendance_records: insertedRecords.length,
          employees: employees.results.length,
          days: 30
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seed data error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

