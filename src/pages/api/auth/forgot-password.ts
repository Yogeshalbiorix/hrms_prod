import type { APIRoute } from 'astro';
import crypto from 'crypto';
import {
  getUserByEmail,
  createPasswordResetToken,
  createAuditLog
} from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const body = await request.json() as any;

    const { email } = body;

    // Validate email
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(db, email);

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we return success but don't send email
    if (!user) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if account is locked
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        return new Response(
          JSON.stringify({
            error: 'Account is locked. Please try again later.'
          }),
          { status: 423, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    const expiresAtISO = expiresAt.toISOString();

    // Store reset token
    const tokenId = await createPasswordResetToken(db, user.id, token, expiresAtISO);

    if (!tokenId) {
      return new Response(
        JSON.stringify({ error: 'Failed to create password reset token' }),
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
      action: 'PASSWORD_RESET_REQUESTED',
      description: `Password reset requested for ${email}`,
      ip_address: clientIP,
      user_agent: userAgent
    });

    // In a production environment, you would send an email here
    // For now, we'll return the token (in production, never do this!)
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)

    const resetLink = `${new URL(request.url).origin}/reset-password?token=${token}`;

    console.log('Password reset link:', resetLink);
    console.log('Token:', token);

    // In production, remove the token from response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        // REMOVE IN PRODUCTION:
        dev_only: {
          token,
          resetLink,
          expiresAt: expiresAtISO
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
