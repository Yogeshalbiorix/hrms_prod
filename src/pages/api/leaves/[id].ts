// API endpoint for individual leave record operations
import type { APIRoute } from 'astro';
import {
  getLeaveById,
  updateLeave,
  type Leave
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
        error: 'Invalid leave ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const leave = await getLeaveById(db, id);

    if (!leave) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Leave record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: leave
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch leave record'
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
        error: 'Invalid leave ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;

    // Recalculate total days if dates changed
    let totalDays = body.total_days;
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const leave: Partial<Leave> = {
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      total_days: totalDays,
      reason: body.reason,
      status: body.status,
      approved_by: body.approved_by,
      approval_date: body.approval_date,
      notes: body.notes
    };

    const success = await updateLeave(db, id, leave);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Leave record not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Leave request updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update leave request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
