import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  getUserFromSession,
  getUserByUsername,
  updateUserPassword,
  deleteAllUserSessions,
  createSession,
  createAuditLog
} from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
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
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      return new Response(
        JSON.stringify({
          error: 'Password must contain at least one letter and one number'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get full user with password hash
    const fullUser = await getUserByUsername(db, user.username);
    if (!fullUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, fullUser.password_hash!);
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const updated = await updateUserPassword(db, user.id!, newPasswordHash);

    if (!updated) {
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
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
      action: 'PASSWORD_CHANGED',
      description: 'User changed their password',
      ip_address: clientIP,
      user_agent: userAgent
    });

    // Invalidate all sessions except current one for security
    // Then create a new session with the same token
    await deleteAllUserSessions(db, user.id!);

    // Create new session with same token
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await createSession(db, user.id!, sessionToken, expiresAt.toISOString(), clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password changed successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Change password error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
