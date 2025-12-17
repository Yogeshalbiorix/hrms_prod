import type { APIRoute } from 'astro';
import { sendPasswordResetEmail } from '../../../lib/email-service';

/**
 * Test endpoint to verify password reset email functionality
 * GET /api/auth/test-reset-email
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || 'yogesh.albiorix@gmail.com';

    console.log('🧪 Testing password reset email to:', email);

    // Generate test reset link
    const testToken = 'test_token_' + Date.now();
    const resetLink = `${url.origin}/reset-password?token=${testToken}`;

    // Set expiry to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    const expiresAtISO = expiresAt.toISOString();

    // Send test password reset email
    const success = await sendPasswordResetEmail(
      email,
      'Test User',
      resetLink,
      expiresAtISO
    );

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `✅ Test password reset email sent successfully to ${email}`,
          resetLink: resetLink,
          expiresAt: expiresAtISO
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: '❌ Failed to send test password reset email',
          note: 'Check server logs for details'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in test-reset-email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

