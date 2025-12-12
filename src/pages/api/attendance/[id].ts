// API endpoint for individual attendance record operations
import type { APIRoute } from 'astro';
import {
  getAttendanceById,
  updateAttendance,
  type Attendance
} from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
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

    const attendance = await getAttendanceById(db, id);

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

    const attendance: Partial<Attendance> = {
      check_in_time: body.check_in_time,
      check_out_time: body.check_out_time,
      status: body.status,
      notes: body.notes
    };

    const success = await updateAttendance(db, id, attendance);

    if (!success) {
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
      error: 'Failed to update attendance record'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
