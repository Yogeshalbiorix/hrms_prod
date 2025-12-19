import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../../lib/db';

// GET - Fetch all activity requests (admin only)
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserFromSession(db, sessionToken);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request type from query params (wfh, partial, regularization, or all)
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status'); // pending, approved, rejected, or all

    let wfhRequests: any[] = [];
    let partialRequests: any[] = [];
    let regularizationRequests: any[] = [];

    // Fetch Work From Home requests
    if (type === 'all' || type === 'wfh') {
      const wfhQuery = await db
        .prepare(`
          SELECT 
            w.id, w.employee_id, w.date, w.reason, w.status, w.notes,
            w.created_at, w.approval_date, w.approved_by,
            (e.first_name || ' ' || e.last_name) as employee_name, 
            e.email as employee_email, 
            COALESCE(d.name, 'No Department') as department,
            u.username as approver_username
          FROM work_from_home_requests w
          JOIN employees e ON w.employee_id = e.id
          LEFT JOIN departments d ON e.department_id = d.id
          LEFT JOIN users u ON w.approved_by = u.id
          ${status && status !== 'all' ? 'WHERE w.status = ?' : ''}
          ORDER BY w.created_at DESC
          LIMIT 100
        `)
        .bind(...(status && status !== 'all' ? [status] : []))
        .all();

      wfhRequests = (wfhQuery.results || []).map(r => ({
        ...r,
        request_type: 'wfh'
      }));
    }

    // Fetch Partial Day requests
    if (type === 'all' || type === 'partial') {
      const partialQuery = await db
        .prepare(`
          SELECT 
            p.id, p.employee_id, p.date, p.start_time, p.end_time, p.duration, p.reason, p.status, p.notes,
            p.created_at, p.approval_date, p.approved_by,
            (e.first_name || ' ' || e.last_name) as employee_name, 
            e.email as employee_email, 
            COALESCE(d.name, 'No Department') as department,
            u.username as approver_username
          FROM partial_day_requests p
          JOIN employees e ON p.employee_id = e.id
          LEFT JOIN departments d ON e.department_id = d.id
          LEFT JOIN users u ON p.approved_by = u.id
          ${status && status !== 'all' ? 'WHERE p.status = ?' : ''}
          ORDER BY p.created_at DESC
          LIMIT 100
        `)
        .bind(...(status && status !== 'all' ? [status] : []))
        .all();

      partialRequests = (partialQuery.results || []).map(r => ({
        ...r,
        request_type: 'partial'
      }));
    }

    // Fetch Regularization requests
    if (type === 'all' || type === 'regularization') {
      const regQuery = await db
        .prepare(`
          SELECT 
            r.id, r.employee_id, r.date, r.clock_in, r.clock_out, r.reason, r.status, r.notes,
            r.created_at, r.approval_date, r.approved_by,
            (e.first_name || ' ' || e.last_name) as employee_name, 
            e.email as employee_email, 
            COALESCE(d.name, 'No Department') as department,
            u.username as approver_username
          FROM regularization_requests r
          JOIN employees e ON r.employee_id = e.id
          LEFT JOIN departments d ON e.department_id = d.id
          LEFT JOIN users u ON r.approved_by = u.id
          ${status && status !== 'all' ? 'WHERE r.status = ?' : ''}
          ORDER BY r.created_at DESC
          LIMIT 100
        `)
        .bind(...(status && status !== 'all' ? [status] : []))
        .all();

      regularizationRequests = (regQuery.results || []).map(r => ({
        ...r,
        request_type: 'regularization'
      }));
    }

    // Combine and sort all requests
    const allRequests = [...wfhRequests, ...partialRequests, ...regularizationRequests]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          wfh: wfhRequests,
          partial: partialRequests,
          regularization: regularizationRequests,
          all: allRequests,
          counts: {
            wfh: wfhRequests.length,
            partial: partialRequests.length,
            regularization: regularizationRequests.length,
            total: allRequests.length
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fetch activity requests error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch activity requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Approve or reject a request (admin only)
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserFromSession(db, sessionToken);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { id, type, action, notes } = body;

    if (!id || !type || !action) {
      return new Response(JSON.stringify({ error: 'Request ID, type, and action are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action !== 'approve' && action !== 'reject') {
      return new Response(JSON.stringify({ error: 'Action must be "approve" or "reject"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const approvalDate = new Date().toISOString();

    // Determine which table to update
    let tableName = '';
    if (type === 'wfh') {
      tableName = 'work_from_home_requests';
    } else if (type === 'partial') {
      tableName = 'partial_day_requests';
    } else if (type === 'regularization') {
      tableName = 'regularization_requests';
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the request
    await db
      .prepare(`
        UPDATE ${tableName}
        SET status = ?, approved_by = ?, approval_date = ?, notes = ?
        WHERE id = ?
      `)
      .bind(newStatus, user.id, approvalDate, notes || null, id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Request ${action}d successfully`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update activity request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update activity request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
