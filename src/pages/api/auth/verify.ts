import type { APIRoute } from 'astro';
import { getDB, getUserFromSession } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime.env);

    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'No session token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate session and get user
    const user = await getUserFromSession(db, sessionToken);

    if (!user) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return user data
    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          employee_id: user.employee_id,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verify session error:', error);
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
