// API endpoint for individual department operations (GET, PUT, DELETE)
import type { APIRoute } from 'astro';
import { updateDepartment, deleteDepartment, getDepartmentEmployeeCount, getDB } from '../../../lib/db';

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

    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Department ID is required'
      }), {
        status: 400,
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

    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      manager_id: manager_id || null
    };

    // Update in local database
    const success = await updateDepartment(db, parseInt(id), updateData);

    if (success) {
      // Sync to remote database
      try {
        const { executeSync } = await import('../../../lib/db-sync');
        const query = `
          UPDATE departments 
          SET name = ?, description = ?, manager_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        const params = [updateData.name, updateData.description, updateData.manager_id, parseInt(id)];
        await executeSync(db, query, params);
      } catch (syncError) {
        console.warn('Remote sync failed for department update:', syncError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Department updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update department'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error updating department:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to update department'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const id = params.id;
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

    const success = await deleteDepartment(db, parseInt(id));

    if (success) {
      // Sync delete to remote database
      try {
        const { executeSync } = await import('../../../lib/db-sync');
        const query = `DELETE FROM departments WHERE id = ?`;
        await executeSync(db, query, [parseInt(id)]);
      } catch (syncError) {
        console.warn('Remote sync failed for department deletion:', syncError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Department deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete department'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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
