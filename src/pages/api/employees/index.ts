// API endpoint for employee operations
// GET: List all employees with optional filters
// POST: Create new employee

import type { APIRoute } from 'astro';
import { getAllEmployees, searchEmployees, createEmployee, getEmployeeStats } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals?.runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const departmentId = url.searchParams.get('departmentId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const stats = url.searchParams.get('stats') === 'true';

    // If stats requested, return statistics
    if (stats) {
      const statistics = await getEmployeeStats(db);
      return new Response(JSON.stringify(statistics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let employees;

    // If search term provided, use search
    if (search) {
      employees = await searchEmployees(
        db,
        search,
        departmentId ? parseInt(departmentId) : undefined,
        status || undefined
      );
    } else {
      employees = await getAllEmployees(db, limit, offset);

      // Apply filters if provided
      if (departmentId) {
        employees = employees.filter(e => e.department_id === parseInt(departmentId));
      }
      if (status) {
        employees = employees.filter(e => e.status === status);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: employees,
      count: employees.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch employees',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals?.runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email || !body.position || !body.join_date) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'email', 'position', 'join_date']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create employee with remote sync enabled
    const result = await createEmployee(db, body, true);

    // Prepare response message
    let message = 'Employee created successfully (synced to both databases)';
    if (result.username && result.password) {
      message += `. User account created - Username: ${result.username}, Password: ${result.password}`;
    }

    return new Response(JSON.stringify({
      success: true,
      message: message,
      data: {
        id: result.id,
        employee_id: result.employee_id,
        username: result.username,
        temporary_password: result.password
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating employee:', error);

    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Employee with this email or employee ID already exists'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create employee',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
