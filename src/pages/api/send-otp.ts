import type { APIRoute } from 'astro';
import { sendOTPEmail } from '../../lib/email-service';

/**
 * API endpoint to send OTP to user's email
 * POST /api/send-otp
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as {
      email?: string;
      name?: string;
      purpose?: string;
      expiryMinutes?: number;
    };
    const { email, name, purpose, expiryMinutes } = body;

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send OTP
    const result = await sendOTPEmail(
      email,
      name,
      (purpose as 'login' | 'registration' | 'password_reset' | 'email_verification') || 'login',
      expiryMinutes || 10
    );

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in send-otp API:', error);
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
