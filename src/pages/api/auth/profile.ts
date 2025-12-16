import type { APIRoute } from 'astro';
import {
  getUserFromSession,
  updateUserProfile,
  createAuditLog
} from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const db = locals.runtime.env.DB;

    // Get session token from cookie or Authorization header
    let sessionToken = cookies.get('session_token')?.value;
    if (!sessionToken) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
      }
    }

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify session and get user
    const user = await getUserFromSession(db, sessionToken);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return user profile data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          employee_id: user.employee_id,
          is_active: user.is_active,
          last_login: user.last_login,
          created_at: user.created_at
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Profile fetch error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request, locals, cookies }) => {
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

    const body = await request.json() as any;
    const { full_name, email, phone, profile_image } = body;

    // Update user profile
    const updated = await updateUserProfile(db, user.id!, {
      full_name,
      email,
      phone,
      profile_image
    });

    if (!updated) {
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP
    const clientIP = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log
    await createAuditLog(db, {
      user_id: user.id,
      action: 'PROFILE_UPDATED',
      description: 'User profile information updated',
      ip_address: clientIP,
      user_agent: userAgent
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
