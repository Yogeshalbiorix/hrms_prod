import type { APIRoute } from 'astro';
import { getDB } from '../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const db = getDB((locals as any).runtime?.env || (locals as any).env);

        // Get session token from auth header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        // Verify session and get user
        const session = await db.prepare(
            'SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP'
        ).bind(token).first();

        if (!session) {
            return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
        }

        // Get employee record for the user
        // Assuming users table has employee_id or we need to join/lookup
        // Based on schema, employees table has email. users table usually has email too.
        // Let's get user email first
        const user = await db.prepare('SELECT email, role FROM users WHERE id = ?').bind(session.user_id).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        // Find employee by email
        const employee = await db.prepare('SELECT id FROM employees WHERE email = ?').bind(user.email).first();

        if (!employee) {
            // If user is admin but not an employee, they might just see all or empty? 
            // For "My Leave Requests", we expect an employee record.
            return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
        }

        // Fetch leave history
        const { results } = await db.prepare(
            'SELECT * FROM employee_leave_history WHERE employee_id = ? ORDER BY created_at DESC'
        ).bind(employee.id).all();

        return new Response(JSON.stringify({ success: true, data: results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

// ... existing imports
import { validateLeaveRequest, updateLeaveBalance, type LeaveType } from '../../lib/leave-logic';
import { sendLeaveRequestEmail } from '../../lib/email-service';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const db = getDB((locals as any).runtime?.env || (locals as any).env);
        const body = await request.json() as any;
        const { leave_type, start_date, end_date, reason, is_half_day, half_day_period } = body;

        // Validation
        if (!leave_type || !start_date || !end_date || !reason) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        // Auth check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        const session = await db.prepare(
            'SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP'
        ).bind(token).first();

        if (!session) {
            return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
        }

        const user = await db.prepare('SELECT email FROM users WHERE id = ?').bind(session.user_id).first();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const employee = await db.prepare('SELECT id, first_name, last_name, email FROM employees WHERE email = ?').bind(user.email).first();
        if (!employee) {
            return new Response(JSON.stringify({ error: 'Employee record not found' }), { status: 404 });
        }

        // Calculate Duration
        let duration: number;
        let total_days_int: number;

        if (is_half_day) {
            duration = 0.5;
            total_days_int = 1; // Store as 1 day entry in legacy total_days INT column
        } else {
            const start = new Date(start_date);
            const end = new Date(end_date);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return new Response(JSON.stringify({ error: 'Invalid date format' }), { status: 400 });
            }

            const diffTime = Math.abs(end.getTime() - start.getTime());
            total_days_int = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            duration = total_days_int;
        }

        if (isNaN(duration) || isNaN(total_days_int)) {
            return new Response(JSON.stringify({ error: 'Invalid duration calculation' }), { status: 400 });
        }

        // Validate Leave Request (Policy Checks)
        const validation = await validateLeaveRequest(db, employee.id, leave_type as LeaveType, start_date, end_date, reason, duration);
        if (!validation.valid) {
            return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
        }

        // Insert leave request
        // Check if new columns exist by trying to insert them, or fallback to standard?
        // We know they exist now because we migrated.
        // Insert leave request
        const result = await db.prepare(
            `INSERT INTO employee_leave_history 
      (employee_id, leave_type, start_date, end_date, total_days, reason, status, duration, is_half_day, half_day_period) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
        ).bind(
            employee.id,
            leave_type,
            start_date,
            end_date,
            total_days_int,
            reason,
            duration,
            is_half_day ? 1 : 0,
            half_day_period || null
        ).run();

        if (result.success) {
            // Update Balance
            await updateLeaveBalance(db, employee.id, leave_type as LeaveType, duration);

            // Email notification (non-blocking)
            try {
                const env = locals.runtime?.env || (locals as any).env;
                console.log(`[Leave Request] Sending email to: ${employee.email}`);
                if (employee.email) {
                    await sendLeaveRequestEmail(
                        employee.email,
                        `${employee.first_name} ${employee.last_name}`,
                        {
                            leave_type,
                            start_date,
                            end_date,
                            total_days: total_days_int,
                            reason,
                            status: 'pending'
                        } as any,
                        env
                    ).then(() => console.log(`[Leave Request] Email sent successfully to ${employee.email}`))
                        .catch((err: any) => console.error(`[Leave Request] Failed to send email:`, err));
                }
            } catch (e) {
                console.error('[Leave Request] Email logic error:', e);
            }

            return new Response(JSON.stringify({ success: true, message: 'Leave request submitted successfully' }), { status: 201 });
        } else {
            console.error('[Leave Request] DB Insert Failed:', result);
            return new Response(JSON.stringify({ error: 'Failed to create leave request' }), { status: 500 });
        }

    } catch (error: any) {
        console.error('Error creating leave request:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: error.message || String(error),
            stack: error.stack
        }), { status: 500 });
    }
};
