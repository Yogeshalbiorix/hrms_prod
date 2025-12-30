import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db';
import { updateLeaveBalance, type LeaveType } from '../../../lib/leave-logic';
import { sendLeaveStatusEmail } from '../../../lib/email-service';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
    try {
        const db = getDB((locals as any).runtime?.env || (locals as any).env);

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

        // Identify user/employee and role
        const user = await db.prepare('SELECT email, role, full_name FROM users WHERE id = ?').bind(session.user_id).first();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const employee = await db.prepare('SELECT id FROM employees WHERE email = ?').bind(user.email).first();
        // If employee not found (e.g. admin-only user), that's fine for approval, but we need ID for cancellation owners.

        // Parse body for action/status
        const body = await request.json() as { status: string; rejection_reason?: string };
        const { status, rejection_reason } = body;

        // Supported statuses
        if (!['cancelled', 'approved', 'rejected'].includes(status)) {
            return new Response(JSON.stringify({ error: 'Invalid status update' }), { status: 400 });
        }

        // Fetch existing leave
        const leave = await db.prepare(`
            SELECT l.*, e.email as employee_email, e.first_name, e.last_name 
            FROM employee_leave_history l
            JOIN employees e ON l.employee_id = e.id
            WHERE l.id = ?
        `).bind(id).first();

        if (!leave) {
            return new Response(JSON.stringify({ error: 'Leave request not found' }), { status: 404 });
        }

        // Auth Logic
        const isOwner = employee && leave.employee_id === employee.id;
        const isAdminOrManager = ['admin', 'hr', 'manager'].includes(user.role);

        if (status === 'cancelled') {
            // Only owner can cancel (or admin/manager too?) - Let's allow owner.
            if (!isOwner && !isAdminOrManager) {
                return new Response(JSON.stringify({ error: 'Unauthorized to cancel this request' }), { status: 403 });
            }
            if (leave.status !== 'pending') {
                return new Response(JSON.stringify({ error: 'Only pending requests can be cancelled' }), { status: 400 });
            }
        }
        else if (status === 'approved' || status === 'rejected') {
            // Only Admin/HR/Manager can approve/reject
            if (!isAdminOrManager) {
                return new Response(JSON.stringify({ error: 'Unauthorized to approve/reject requests' }), { status: 403 });
            }
            // Cannot change status if already processed (unless we want to allow changing decisions? For now simple flow: pending -> X)
            if (leave.status !== 'pending') {
                return new Response(JSON.stringify({ error: `Request is already ${leave.status}` }), { status: 400 });
            }
        }

        // Balance Update Logic
        // If 'cancelled' or 'rejected', we must REFUND the balance (since we deducted it on creation in API)
        // Check API creation logic -> yes, `updateLeaveBalance` was called.
        // So we need to call `updateLeaveBalance` with negative duration to add it back.

        if (status === 'cancelled' || status === 'rejected') {
            // Refund balance
            // updateLeaveBalance adds to 'paid_leave_used'. So to refund, we subtract.
            // Our function `updateLeaveBalance` does: SET paid_leave_used = paid_leave_used + ?
            // So passing negative duration will reduce 'used', thus increasing available.
            // leave.duration might be stored. API text says "duration" column.

            let refundAmount = leave.duration;
            // If duration is null (old record?), calculate from total_days?
            if (!refundAmount) refundAmount = leave.total_days; // fall back

            // Only refund for types that consume balance
            // 'vacation', 'sick', 'personal'
            const type = leave.leave_type as LeaveType;
            if (['vacation', 'sick', 'personal'].includes(type) && refundAmount > 0) {
                await updateLeaveBalance(db, leave.employee_id, type, -refundAmount);
                console.log(`Refunding ${refundAmount} days for leave ${id} (${status})`);
            }
        }

        // Update DB Status
        let query = "UPDATE employee_leave_history SET status = ?, updated_at = CURRENT_TIMESTAMP";
        const paramsBind = [status];

        if (status === 'rejected' && rejection_reason) {
            query += ", rejection_reason = ?";
            paramsBind.push(rejection_reason);
        }

        if ((status === 'approved' || status === 'rejected') && user.full_name) {
            query += ", approved_by = ?, approval_date = CURRENT_TIMESTAMP";
            paramsBind.push(user.full_name);
        }

        query += " WHERE id = ?";
        paramsBind.push(id);

        const result = await db.prepare(query).bind(...paramsBind).run();

        if (result.success) {
            // Send Email Notification
            const env = locals.runtime?.env || (locals as any).env;
            if (leave.employee_email) {
                await sendLeaveStatusEmail(
                    leave.employee_email,
                    `${leave.first_name} ${leave.last_name}`,
                    {
                        leave_type: leave.leave_type,
                        start_date: leave.start_date,
                        end_date: leave.end_date,
                        total_days: leave.total_days,
                        status: status,
                        rejection_reason: rejection_reason,
                        approved_by: user.full_name
                    },
                    env
                ).catch(err => console.error('Failed to send status email:', err));
            }

            return new Response(JSON.stringify({ success: true, message: `Leave request ${status} successfully` }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Failed to update leave request' }), { status: 500 });
        }

    } catch (error: any) {
        console.error('Error updating leave request:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: error.message
        }), { status: 500 });
    }
};
