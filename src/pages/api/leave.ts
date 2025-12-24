import type { APIRoute } from 'astro';
import { getDB } from '../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const db = getDB(locals.runtime?.env || locals.env);

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

import { validateLeaveRequest, updateLeaveBalance, type LeaveType } from '../../lib/leave-logic';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const db = getDB(locals.runtime?.env || locals.env);
        const body = await request.json();
        const { leave_type, start_date, end_date, reason } = body;

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

        const employee = await db.prepare('SELECT id FROM employees WHERE email = ?').bind(user.email).first();
        if (!employee) {
            return new Response(JSON.stringify({ error: 'Employee record not found' }), { status: 404 });
        }

        // Validate Leave Request (Policy Checks)
        const validation = await validateLeaveRequest(db, employee.id, leave_type as LeaveType, start_date, end_date, reason);
        if (!validation.valid) {
            return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
        }

        // Calculate total days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        // Insert leave request
        const result = await db.prepare(
            `INSERT INTO employee_leave_history 
      (employee_id, leave_type, start_date, end_date, total_days, reason, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending')`
        ).bind(employee.id, leave_type, start_date, end_date, total_days, reason).run();

        if (result.success) {
            // Update Balance
            await updateLeaveBalance(db, employee.id, leave_type as LeaveType, total_days);

            return new Response(JSON.stringify({ success: true, message: 'Leave request submitted successfully' }), { status: 201 });
        } else {
            return new Response(JSON.stringify({ error: 'Failed to create leave request' }), { status: 500 });
        }

    } catch (error) {
        console.error('Error creating leave request:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
