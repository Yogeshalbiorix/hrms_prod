import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  getPasswordResetToken,
  updateUserPassword,
  markPasswordResetTokenAsUsed,
  deleteAllUserSessions,
  createAuditLog,
  getDB
} from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    const body = await request.json() as any;

    const { token, newPassword } = body;

    // Validate inputs
    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Token and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
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

    // Verify token
    const resetToken = await getPasswordResetToken(db, token);

    if (!resetToken) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired reset token'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const updated = await updateUserPassword(db, resetToken.user_id, passwordHash);

    if (!updated) {
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    await markPasswordResetTokenAsUsed(db, token);

    // Invalidate all existing sessions for security
    await deleteAllUserSessions(db, resetToken.user_id);

    // Get client IP
    const clientIP = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log
    await createAuditLog(db, {
      user_id: resetToken.user_id,
      action: 'PASSWORD_RESET_COMPLETED',
      description: 'Password was successfully reset',
      ip_address: clientIP,
      user_agent: userAgent
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

