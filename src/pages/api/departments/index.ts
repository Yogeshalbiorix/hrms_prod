// API endpoint for department operations
import type { APIRoute } from 'astro';
import {
  getAllDepartments,
  createDepartment,
  deleteDepartment,
  getDepartmentEmployeeCount
} from '../../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
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

    const departments = await getAllDepartments(db);

    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const count = await getDepartmentEmployeeCount(db, dept.id);
        return {
          ...dept,
          employee_count: count
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      data: departmentsWithCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch departments'
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

    const body = await request.json();
    const { name, description, manager_id } = body;

    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Department name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await createDepartment(db, {
      name: name.trim(),
      description: description?.trim() || null,
      manager_id: manager_id || null
    }, true);

    return new Response(JSON.stringify({
      success: true,
      message: 'Department created successfully (synced to both databases)',
      data: result
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create department'
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Department ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if department has employees
    const employeeCount = await getDepartmentEmployeeCount(db, parseInt(id));
    if (employeeCount > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot delete department with ${employeeCount} employee(s). Please reassign employees first.`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await deleteDepartment(db, parseInt(id));

    return new Response(JSON.stringify({
      success: true,
      message: 'Department deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to delete department'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
