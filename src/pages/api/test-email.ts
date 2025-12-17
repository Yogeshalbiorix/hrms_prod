import type { APIRoute } from 'astro';
import { sendOTPEmail } from '../../lib/email-service';

/**
 * Test endpoint to verify EmailJS configuration
 * GET /api/test-email
 */
export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Testing EmailJS configuration...');

    // Send test OTP to your email
    const result = await sendOTPEmail(
      'yogesh.albiorix@gmail.com',
      'Yogesh Purnawasi',
      'login',
      10
    );

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '✅ Email sent successfully! Check your inbox at yogesh.albiorix@gmail.com',
          details: 'OTP email has been sent via EmailJS'
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
          message: '❌ Failed to send email',
          details: result.message,
          note: 'Check browser console for more details'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in test-email API:', error);
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

