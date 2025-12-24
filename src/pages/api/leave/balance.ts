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
        const balance = await ensureLeaveBalance(db, employee.id, year);

        return new Response(JSON.stringify({ success: true, data: balance }), { status: 200 });
    } catch (error) {
        console.error('Error fetching leave balance:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
