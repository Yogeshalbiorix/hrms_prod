
import type { APIRoute } from 'astro';
import { getDB, getAllEmployees } from '../../../lib/db';
import dayjs from 'dayjs';

export const GET: APIRoute = async ({ locals, url, request }) => {
    try {
        const db = getDB(locals.runtime?.env || locals.env);
        const sessionToken = request.headers.get('Authorization')?.split(' ')[1];

        // In a real app, verify the token and get the current user.
        // For now, we'll trust the caller or just return everything if no manager_id is passed,
        // or filter by manager_id if passed.

        const year = parseInt(url.searchParams.get('year') || dayjs().year().toString());
        const month = parseInt(url.searchParams.get('month') || (dayjs().month() + 1).toString());
        const managerId = url.searchParams.get('manager_id');

        // Calculate start and end dates for the month
        const startDate = dayjs(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
        const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');

        // 1. Get Employees
        let employees = await getAllEmployees(db);
        if (managerId) {
            // Filter in memory for now as getAllEmployees doesn't support manager filter yet?
            // Actually let's just return all for the team view or rely on frontend to filter if needed, 
            // but typically we want server side filtering.
            // For this task, "My Team" usually implies fetching employees where manager_id = currentUser.id.
            // However, to keep it simple and robust, I'll fetch all and let the component filter or 
            // add a query param support later. 
            // Wait, if the user requests "My Team", they expect THEIR team.
            // Let's assume the frontend passes the manager_id logic or we filter if managerId param is present.
            employees = employees.filter(e => e.manager_id === parseInt(managerId));
        }

        // 2. Fetch Attendance for the date range
        // We need a custom query for this range as getAllAttendance might be page based.
        const attendanceQuery = `
      SELECT * FROM employee_attendance 
      WHERE attendance_date BETWEEN ? AND ?
    `;
        const attendanceRecords = await db.prepare(attendanceQuery).bind(startDate, endDate).all();

        // 3. Fetch Leaves for the date range
        // Leaves can span across months, so we check overlap.
        const leaveQuery = `
      SELECT * FROM employee_leave_history 
      WHERE status = 'approved' 
      AND (
        (start_date BETWEEN ? AND ?) OR
        (end_date BETWEEN ? AND ?) OR
        (start_date <= ? AND end_date >= ?)
      )
    `;
        const leaveRecords = await db.prepare(leaveQuery).bind(startDate, endDate, startDate, endDate, startDate, endDate).all();

        // 4. Build the calendar structure
        const calendarData: Record<number, Record<string, any>> = {};

        // Initialize map
        employees.forEach(emp => {
            calendarData[emp.id!] = {};
        });

        const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();

        // Helper to check if weekend
        const isWeekend = (dateStr: string) => {
            const day = dayjs(dateStr).day();
            return day === 0 || day === 6; // Sunday or Saturday
        };

        // Fill defaults (Weekends)
        employees.forEach(emp => {
            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = dayjs(`${year}-${month}-${i}`).format('YYYY-MM-DD');
                if (isWeekend(dateStr)) {
                    calendarData[emp.id!][dateStr] = { status: 'weekend', label: 'Weekly Off' };
                } else {
                    calendarData[emp.id!][dateStr] = { status: 'empty', label: '-' };
                }
            }
        });

        // Merge Leaves
        if (leaveRecords.results) {
            (leaveRecords.results as any[]).forEach(leave => {
                if (!calendarData[leave.employee_id]) return;

                let current = dayjs(leave.start_date);
                const end = dayjs(leave.end_date);

                while (current.isBefore(end) || current.isSame(end, 'day')) {
                    const dateStr = current.format('YYYY-MM-DD');
                    // Check if date is within the requested month
                    if (current.month() + 1 === month && current.year() === year) {
                        calendarData[leave.employee_id][dateStr] = {
                            status: 'leave',
                            type: leave.leave_type,
                            label: leave.leave_type === 'sick' ? 'Sick Leave' : 'Paid Leave' // Simplify for now
                        };
                    }
                    current = current.add(1, 'day');
                }
            });
        }

        // Merge Attendance (overrides weekend/empty if present, overrides leave ideally? No, leave > attendance usually, but if they worked on leave... let's say Attendance confirms presence)
        if (attendanceRecords.results) {
            (attendanceRecords.results as any[]).forEach(att => {
                if (!calendarData[att.employee_id]) return;
                const dateStr = att.attendance_date;

                // If present/late/half-day
                let status = att.status;
                let label = 'Present';
                if (status === 'late') label = 'Late';
                if (status === 'half-day') label = 'Half Day';

                calendarData[att.employee_id][dateStr] = {
                    status: 'present',
                    detail: status,
                    check_in: att.check_in_time,
                    check_out: att.check_out_time,
                    label: label,
                    work_mode: att.work_mode
                };
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: {
                employees,
                calendar: calendarData
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching team calendar:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch team calendar'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
