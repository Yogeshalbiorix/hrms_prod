import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
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
    if (!user || !user.employee_id) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { date, reason } = body;

    if (!date) {
      return new Response(JSON.stringify({ error: 'Date is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert work from home request
    const result = await db
      .prepare(`
        INSERT INTO work_from_home_requests (employee_id, date, reason, status)
        VALUES (?, ?, ?, 'pending')
      `)
      .bind(user.employee_id, date, reason || null)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Work from home request submitted successfully',
        data: { id: result.meta.last_row_id }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Work from home request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to submit work from home request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET - Fetch work from home requests for the logged-in user
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
    if (!user || !user.employee_id) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requests = await db
      .prepare(`
        SELECT 
          id, date, reason, status, notes, 
          created_at, approval_date
        FROM work_from_home_requests
        WHERE employee_id = ?
        ORDER BY date DESC
        LIMIT 50
      `)
      .bind(user.employee_id)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        data: requests.results || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fetch WFH requests error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch work from home requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
