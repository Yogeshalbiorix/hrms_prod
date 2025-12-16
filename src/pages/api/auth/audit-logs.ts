import type { APIRoute } from 'astro';
import {
  getUserFromSession,
  getUserAuditLogs
} from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const db = locals.runtime.env.DB;
    const sessionToken = cookies.get('session_token')?.value;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify session and get user
    const user = await getUserFromSession(db, sessionToken);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get pagination parameters from query string
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get user's audit logs
    const logs = await getUserAuditLogs(db, user.id!, limit, offset);

    return new Response(
      JSON.stringify({
        success: true,
        logs
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Audit logs error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
