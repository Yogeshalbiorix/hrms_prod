import type { APIRoute } from 'astro';
import crypto from 'crypto';
import {
  getUserByEmail,
  createPasswordResetToken,
  createAuditLog
} from '../../../lib/db';
import { sendPasswordResetEmail } from '../../../lib/email-service';

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
    if ((user as any).locked_until) {
      const lockedUntil = new Date((user as any).locked_until);
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
    const tokenId = await createPasswordResetToken(db, user.id!, token, expiresAtISO);

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

    // Send password reset email
    const resetLink = `${new URL(request.url).origin}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(
        email,
        user.full_name || user.username,
        resetLink,
        expiresAtISO
      );

      console.log('✅ Password reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Continue even if email fails - user can request again
    }

    // Return success response (never expose actual token in production)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'If the email exists, a password reset link has been sent to your email address'
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
