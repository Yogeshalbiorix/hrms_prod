// API endpoint for individual employee operations
// GET: Get employee by ID
// PUT/PATCH: Update employee
// DELETE: Delete employee (soft delete)

import type { APIRoute } from 'astro';
import { getEmployeeById, updateEmployee, deleteEmployee, hardDeleteEmployee, getDB } from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    console.log('GET /api/employees/[id] - params:', params);
    const db = getDB(locals.runtime?.env || locals.env);

    if (!db) {
      console.error('Database not configured');
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = parseInt(params.id || '0');
    console.log('Fetching employee with id:', id);

    if (!id || isNaN(id)) {
      console.error('Invalid employee ID:', params.id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid employee ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const employee = await getEmployeeById(db, id);
    console.log('Employee found:', employee ? 'yes' : 'no');

    if (!employee) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Employee not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: employee
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch employee',
      message: error instanceof Error ? error.message : 'Unknown error'
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
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid employee ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if employee exists
    const existingEmployee = await getEmployeeById(db, id);
    if (!existingEmployee) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Employee not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    console.log('Update employee request:', { id, body });

    // Update employee
    const success = await updateEmployee(db, id, body);
    console.log('Update employee success:', success);

    if (!success) {
      console.error('Update employee failed for id:', id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update employee'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch updated employee
    const updatedEmployee = await getEmployeeById(db, id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating employee:', error);

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email already exists for another employee'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update employee',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = PUT; // PATCH uses same logic as PUT

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = parseInt(params.id || '0');

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid employee ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if employee exists
    const existingEmployee = await getEmployeeById(db, id);
    if (!existingEmployee) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Employee not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === 'true';

    let success;
    if (hard) {
      // Hard delete - permanently remove
      success = await hardDeleteEmployee(db, id);
    } else {
      // Soft delete - set status to terminated
      success = await deleteEmployee(db, id);
    }

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete employee'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: hard ? 'Employee permanently deleted' : 'Employee terminated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete employee',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
