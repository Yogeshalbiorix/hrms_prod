import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
    try {
        const db = getDB(locals.runtime?.env || locals.env);

        // Get leave ID
        const { id } = params;
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing leave ID' }), { status: 400 });
        }

        // Verify Auth
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

        // Identify user/employee
        const user = await db.prepare('SELECT email FROM users WHERE id = ?').bind(session.user_id).first();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }
        const employee = await db.prepare('SELECT id FROM employees WHERE email = ?').bind(user.email).first();
        if (!employee) {
            return new Response(JSON.stringify({ error: 'Employee not found' }), { status: 404 });
        }

        // Parse body for action/status
        const body = await request.json();
        const { status } = body;

        // We only support cancellation for now
        if (status !== 'cancelled') {
            return new Response(JSON.stringify({ error: 'Invalid status update' }), { status: 400 });
        }

        // Fetch existing leave to verify ownership and status
        const leave = await db.prepare('SELECT * FROM employee_leave_history WHERE id = ?').bind(id).first();

        if (!leave) {
            return new Response(JSON.stringify({ error: 'Leave request not found' }), { status: 404 });
        }

        if (leave.employee_id !== employee.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized Access' }), { status: 403 });
        }

        if (leave.status !== 'pending') {
            return new Response(JSON.stringify({ error: 'Only pending requests can be cancelled' }), { status: 400 });
        }

        // Update status
        const result = await db.prepare(
            "UPDATE employee_leave_history SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(id).run();

        if (result.success) {
            return new Response(JSON.stringify({ success: true, message: 'Leave request cancelled successfully' }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Failed to update leave request' }), { status: 500 });
        }

    } catch (error) {
        console.error('Error cancelling leave:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
