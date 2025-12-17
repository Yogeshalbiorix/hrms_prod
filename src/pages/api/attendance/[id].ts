// API endpoint for individual attendance record operations
import type { APIRoute } from 'astro';
import {
  getAttendanceById,
  updateAttendance,
  type Attendance
} from '../../../lib/db';
import { getDB } from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const id = parseInt(params.id || '0');
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid attendance ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const query = `
      SELECT 
        a.*,
        (e.first_name || ' ' || e.last_name) as employee_name,
        e.employee_id as employee_code,
        d.name as department_name
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.id = ?
    `;

    const attendance = await db.prepare(query).bind(id).first();

    if (!attendance) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Attendance record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: attendance
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch attendance record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const id = parseInt(params.id || '0');
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid attendance ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.clock_in !== undefined) {
      updates.push('clock_in = ?');
      bindings.push(body.clock_in);
    }
    if (body.clock_out !== undefined) {
      updates.push('clock_out = ?');
      bindings.push(body.clock_out);
    }
    if (body.working_hours !== undefined) {
      updates.push('working_hours = ?');
      bindings.push(body.working_hours);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      bindings.push(body.status);
    }
    if (body.work_mode !== undefined) {
      updates.push('work_mode = ?');
      bindings.push(body.work_mode);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      bindings.push(body.notes);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`;
    bindings.push(id);

    const result = await db.prepare(query).bind(...bindings).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Attendance record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Attendance record updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update attendance record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
