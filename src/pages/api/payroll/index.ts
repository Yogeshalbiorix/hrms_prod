// API endpoint for payroll operations
import type { APIRoute } from 'astro';
import {
  getAllPayrolls,
  createPayroll,
  deletePayroll,
  getPayrollStats,
  generateBulkPayroll,
  type Payroll
} from '../../../lib/db';

export const GET: APIRoute = async ({ locals, url }) => {
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

    // Get query parameters for filtering
    const employeeId = url.searchParams.get('employee_id');
    const status = url.searchParams.get('status') || undefined;
    const payPeriod = url.searchParams.get('pay_period') || undefined;
    const statsOnly = url.searchParams.get('stats') === 'true';

    // Return stats if requested
    if (statsOnly) {
      const stats = await getPayrollStats(db, { pay_period: payPeriod });
      return new Response(JSON.stringify({
        success: true,
        data: stats
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filters = {
      employee_id: employeeId ? parseInt(employeeId) : undefined,
      status,
      pay_period: payPeriod
    };

    const payrolls = await getAllPayrolls(db, filters);

    return new Response(JSON.stringify({
      success: true,
      data: payrolls
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch payroll records'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json() as any;

    // Handle bulk payroll generation
    if (body.action === 'generate_bulk') {
      if (!body.pay_period_start || !body.pay_period_end || !body.pay_date) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields for bulk generation'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const created = await generateBulkPayroll(db, {
        start: body.pay_period_start,
        end: body.pay_period_end,
        payDate: body.pay_date
      });

      return new Response(JSON.stringify({
        success: true,
        data: { created },
        message: `${created} payroll records created successfully`
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields for single payroll creation
    if (!body.employee_id || !body.pay_period_start || !body.pay_period_end || !body.pay_date) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payroll: Payroll = {
      employee_id: body.employee_id,
      pay_period_start: body.pay_period_start,
      pay_period_end: body.pay_period_end,
      pay_date: body.pay_date,
      base_salary: body.base_salary || 0,
      bonuses: body.bonuses || 0,
      deductions: body.deductions || 0,
      tax: body.tax || 0,
      net_salary: body.net_salary || 0,
      status: body.status || 'draft',
      payment_method: body.payment_method,
      notes: body.notes,
      created_by: body.created_by
    };

    const id = await createPayroll(db, payroll);

    return new Response(JSON.stringify({
      success: true,
      data: { id },
      message: 'Payroll record created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create payroll record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
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

    const body = await request.json();

    if (!body.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await deletePayroll(db, body.id);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payroll record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Payroll record deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete payroll record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
