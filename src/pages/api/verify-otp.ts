import type { APIRoute } from 'astro';
import { verifyOTP } from '../../lib/email-service';

/**
 * API endpoint to verify OTP
 * POST /api/verify-otp
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as {
      email?: string;
      otp?: string;
    };
    const { email, otp } = body;

    // Validate input
    if (!email || !otp) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Email and OTP are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify OTP
    const result = verifyOTP(email, otp);

    return new Response(
      JSON.stringify(result),
      {
        status: result.valid ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in verify-otp API:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        message: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
