import type { APIRoute } from 'astro';
import crypto from 'crypto';
import {
  getUserByEmail,
  createPasswordResetToken,
  createAuditLog,
  getDB
} from '../../../lib/db';
import { sendPasswordResetEmail } from '../../../lib/email-service';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);

    const body = await request.json().catch((err) => {
      console.error('Failed to parse request JSON:', err);
      return null;
    });
    const email = body?.email;

    if (!email) {
      console.error('No email provided in forgot password request.');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await getUserByEmail(db, email);

    // Prevent email enumeration
    if (!user) {
      console.warn(`Forgot password requested for non-existent email: ${email}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Account lock check
    if ((user as any).locked_until) {
      const lockedUntil = new Date((user as any).locked_until);
      if (lockedUntil > new Date()) {
        console.warn(`Account locked for user: ${email}`);
        return new Response(
          JSON.stringify({ error: 'Account is locked. Please try again later.' }),
          { status: 423, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate token
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    const token = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const tokenId = await createPasswordResetToken(db, user.id!, token, expiresAt);
    if (!tokenId) {
      console.error('Failed to create password reset token for user:', email);
      return new Response(
        JSON.stringify({ error: 'Failed to create reset token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Audit log
    try {
      await createAuditLog(db, {
        user_id: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        description: `Password reset requested for ${email}`,
        ip_address:
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for') ||
          'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for forgot password:', auditErr);
    }

    const resetLink = `${new URL(request.url).origin}/reset-password?token=${token}`;

    let emailResult = { success: false, error: 'Unknown error' };
    try {
      emailResult = await sendPasswordResetEmail(
        email,
        user.full_name || user.username,
        resetLink,
        expiresAt
      );
      if (!emailResult.success) {
        console.error('EmailJS error in forgot password:', emailResult.error);
      }
    } catch (err) {
      console.error('EmailJS exception in forgot password:', err, (err as any)?.stack);
      emailResult = { success: false, error: (err as any)?.message || String(err) };
    }

    const isDev =
      (locals.runtime?.env?.NODE_ENV ?? locals.env?.NODE_ENV) !== 'production';

    const response: any = {
      success: true,
      message:
        'If the email exists, a password reset link has been sent to your email'
    };

    if (isDev) {
      response.dev_only = {
        token,
        resetLink,
        expiresAt,
        emailResult
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Forgot password fatal error:', error, error?.stack);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        stack: error?.stack || null
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
