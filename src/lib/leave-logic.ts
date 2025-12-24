import type { D1Database } from '@cloudflare/workers-types';

export type LeaveType =
    | 'sick'
    | 'vacation'
    | 'personal'
    | 'maternity'
    | 'paternity'
    | 'unpaid'
    | 'emergency'
    | 'birthday'
    | 'anniversary'
    | 'partial'
    | 'comp_off'
    | 'overseas';

interface ValidationResult {
    valid: boolean;
    error?: string;
    warning?: string;
}

// Initialize balance for a user if not exists
export async function ensureLeaveBalance(db: any, employeeId: number, year: number) {
    const balance = await db.prepare('SELECT * FROM employee_leave_balances WHERE employee_id = ? AND year = ?')
        .bind(employeeId, year).first();

    if (!balance) {
        // Determine default quotas based on employment? For now use defaults (15 paid).
        await db.prepare(`
      INSERT INTO employee_leave_balances (employee_id, year, paid_leave_quota)
      VALUES (?, ?, 15.0)
    `).bind(employeeId, year).run();

        return await db.prepare('SELECT * FROM employee_leave_balances WHERE employee_id = ? AND year = ?')
            .bind(employeeId, year).first();
    }
    return balance;
}

export async function validateLeaveRequest(
    db: any,
    employeeId: number,
    type: LeaveType,
    startDate: string,
    endDate: string,
    reason: string
): Promise<ValidationResult> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const currentYear = start.getFullYear();
    const currentMonth = start.getMonth();

    // 1. Get Balance
    const balance = await ensureLeaveBalance(db, employeeId, currentYear);

    // COMP OFF (Infinite Balance)
    if (type === 'comp_off') {
        // Valid, infinite.
        return { valid: true, warning: 'Comp Off balance is infinite. Please ensure justification is provided.' };
    }

    // OVERSEAS TRIP
    if (type === 'overseas') {
        const employee = await db.prepare('SELECT join_date FROM employees WHERE id = ?').bind(employeeId).first();
        if (!employee || !employee.join_date) {
            return { valid: false, error: 'Cannot verify service duration.' };
        }
        const joinDate = new Date(employee.join_date);
        const serviceTime = Math.abs(start.getTime() - joinDate.getTime());
        const serviceYears = serviceTime / (1000 * 60 * 60 * 24 * 365.25);

        if (serviceYears < 3) {
            return { valid: false, error: 'Overseas Trip leave is available only after completion of 3 years of service.' };
        }
        return { valid: true };
    }

    // 2. Policy Checks based on Type

    // PAID LEAVE (Vacation/Sick/Personal mapped to 'paid' concept in policy, but detailed in type)
    // Assuming 'vacation', 'sick', 'personal' consume PAID LEAVE QUOTA
    if (['vacation', 'sick', 'personal'].includes(type)) {
        // Check Notice Period
        const today = new Date();
        const noticeDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Policy:
        // 1 day -> 3 days notice
        // 2-3 days -> 5 days notice
        // >4 days -> 10 days notice

        if (totalDays === 1 && noticeDays < 3) return { valid: false, error: 'Policy requires 3 days notice for 1 day leave.' };
        if (totalDays >= 2 && totalDays <= 3 && noticeDays < 5) return { valid: false, error: 'Policy requires 5 days notice for 2-3 days leave.' };
        if (totalDays >= 4 && noticeDays < 10) return { valid: false, error: 'Policy requires 10 days notice for >4 days leave.' };

        // Check Quota
        if (balance.paid_leave_used + totalDays > balance.paid_leave_quota) {
            return { valid: false, error: `Insufficient Paid Leave Balance. Available: ${balance.paid_leave_quota - balance.paid_leave_used}` };
        }
    }

    // EMERGENCY LEAVE
    if (type === 'emergency') {
        // Check monthly limit (1 per month)
        // Need to query history for this month
        const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

        const emergencyCount = await db.prepare(`
      SELECT COUNT(*) as count FROM employee_leave_history 
      WHERE employee_id = ? AND leave_type = 'emergency' 
      AND start_date >= ? AND start_date <= ? AND status != 'rejected' AND status != 'cancelled'
    `).bind(employeeId, startOfMonth, endOfMonth).first();

        if (emergencyCount.count >= 1) {
            // Policy says converts to unpaid. We can allow but warn? Or strictly Block?
            // "Excess emergency leave becomes unpaid leave" -> implies we should probably change type to unpaid or warn user.
            // For now, let's return a warning-like error or block and tell them to select Unpaid.
            return { valid: false, error: 'Monthly Emergency Leave quota exceeded (1/month). Please apply as Unpaid Leave.' };
        }
    }

    // BIRTHDAY LEAVE
    if (type === 'birthday') {
        if (balance.birthday_leave_used) {
            return { valid: false, error: 'Birthday Leave already used this year.' };
        }
        if (totalDays > 1) {
            return { valid: false, error: 'Birthday Leave can only be 1 day.' };
        }
        // Check if weekend? (Policy: "If date falls on weekend, no extra benefit")
        const day = start.getDay();
        if (day === 0 || day === 6) {
            return { valid: true, warning: 'Birthday falls on a weekend; this will consume the quota.' };
        }
    }

    // ANNIVERSARY LEAVE
    if (type === 'anniversary') {
        if (balance.anniversary_leave_used) {
            return { valid: false, error: 'Anniversary Leave already used this year.' };
        }
        if (totalDays > 1) {
            return { valid: false, error: 'Anniversary Leave can only be 1 day.' };
        }
    }

    // MATERNITY
    if (type === 'maternity') {
        const employee = await db.prepare('SELECT gender, join_date FROM employees WHERE id = ?').bind(employeeId).first();
        if (employee.gender?.toLowerCase() !== 'female') {
            return { valid: false, error: 'Maternity leave is applicable to female employees only.' };
        }

        if (employee.join_date) {
            const joinDate = new Date(employee.join_date);
            const today = new Date();
            const serviceMs = today.getTime() - joinDate.getTime();
            const serviceDays = Math.ceil(serviceMs / (1000 * 60 * 60 * 24));

            if (serviceDays < 36) {
                return { valid: false, error: `Minimum 36 days of service required for Maternity Leave. Current: ${serviceDays} days.` };
            }
        }

        if (totalDays > 90) return { valid: false, error: 'Max Maternity Leave is 90 days.' };
    }

    // PATERNITY
    if (type === 'paternity') {
        if (totalDays > 15) return { valid: false, error: 'Max Paternity Leave is 15 days.' };
    }

    return { valid: true };
}

export async function updateLeaveBalance(
    db: any,
    employeeId: number,
    type: LeaveType,
    days: number
) {
    const year = new Date().getFullYear();
    await ensureLeaveBalance(db, employeeId, year);

    if (['vacation', 'sick', 'personal'].includes(type)) {
        await db.prepare('UPDATE employee_leave_balances SET paid_leave_used = paid_leave_used + ? WHERE employee_id = ? AND year = ?')
            .bind(days, employeeId, year).run();
    }
    else if (type === 'birthday') {
        await db.prepare('UPDATE employee_leave_balances SET birthday_leave_used = 1 WHERE employee_id = ? AND year = ?')
            .bind(employeeId, year).run();
    }
    else if (type === 'anniversary') {
        await db.prepare('UPDATE employee_leave_balances SET anniversary_leave_used = 1 WHERE employee_id = ? AND year = ?')
            .bind(employeeId, year).run();
    }
    // Emergency count update? handled by query count, but we could update explicit counter if needed.
}
