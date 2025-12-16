import type { APIRoute } from 'astro';
import { resendOTP } from '../../lib/email-service';

/**
 * API endpoint to resend OTP
 * POST /api/resend-otp
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as {
      email?: string;
      name?: string;
      purpose?: string;
    };
    const { email, name, purpose } = body;

    // Validate input
    if (!email || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email and name are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Resend OTP
    const result = await resendOTP(
      email,
      name,
      (purpose as 'login' | 'registration' | 'password_reset' | 'email_verification') || 'login'
    );

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in resend-otp API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
