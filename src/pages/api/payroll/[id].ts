// API endpoint for individual payroll record operations
import type { APIRoute } from 'astro';
import {
  getPayrollById,
  updatePayroll,
  getDB,
  type Payroll
} from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = parseInt(params.id || '0');
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid payroll ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payroll = await getPayrollById(db, id);

    if (!payroll) {
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
      data: payroll
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch payroll record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = parseInt(params.id || '0');
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid payroll ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as Partial<Payroll>;

    const payroll: Partial<Payroll> = {
      pay_period_start: body.pay_period_start,
      pay_period_end: body.pay_period_end,
      pay_date: body.pay_date,
      base_salary: body.base_salary,
      bonuses: body.bonuses,
      deductions: body.deductions,
      tax: body.tax,
      net_salary: body.net_salary,
      status: body.status,
      payment_method: body.payment_method,
      notes: body.notes,
      approved_by: body.approved_by
    };

    const success = await updatePayroll(db, id, payroll);

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
      message: 'Payroll record updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating payroll:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update payroll record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
