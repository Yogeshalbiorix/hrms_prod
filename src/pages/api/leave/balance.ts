import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';
import { ensureLeaveBalance } from '../../../lib/leave-logic';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const db = getDB(locals.runtime?.env || locals.env);

        // Auth Check
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
        const employee = await db.prepare('SELECT id FROM employees WHERE email = ?').bind(user.email).first();
        if (!employee) {
            return new Response(JSON.stringify({ error: 'Employee not found' }), { status: 404 });
        }

        const year = new Date().getFullYear();
        // Ensure record exists
        await ensureLeaveBalance(db, employee.id, year);

        // Auto-Repair: Recalculate consumed leave from history to ensure accuracy
        const leaves = await db.prepare(`
            SELECT total_days, duration 
            FROM employee_leave_history 
            WHERE employee_id = ? 
            AND status = 'approved'
            AND leave_type IN ('vacation', 'sick', 'personal', 'paid_leave')
            AND strftime('%Y', start_date) = ?
        `).bind(employee.id, String(year)).all();

        let totalConsumed = 0;
        for (const leave of leaves.results || []) {
            totalConsumed += (leave.duration !== null ? leave.duration : leave.total_days);
        }

        // Update the balance with the recalculated value
        await db.prepare(`
            UPDATE employee_leave_balances 
            SET paid_leave_used = ? 
            WHERE employee_id = ? AND year = ?
        `).bind(totalConsumed, employee.id, year).run();

        // Fetch fresh balance
        const balance = await db.prepare('SELECT * FROM employee_leave_balances WHERE employee_id = ? AND year = ?')
            .bind(employee.id, year).first();

        return new Response(JSON.stringify({ success: true, data: balance }), { status: 200 });
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
