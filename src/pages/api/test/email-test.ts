import type { APIRoute } from 'astro';
import { EMAIL_CONFIG } from '../../../lib/email-config';
import { Resend } from 'resend';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const testEmail = url.searchParams.get('email') || 'yogesh.albiorix@gmail.com';

    // Allow overriding from query params for debugging
    const overrideApiKey = url.searchParams.get('api_key');

    if (!EMAIL_CONFIG || !EMAIL_CONFIG.RESEND) {
      throw new Error('EMAIL_CONFIG or RESEND configuration is missing');
    }

    const API_KEY = overrideApiKey || EMAIL_CONFIG.RESEND.API_KEY;

    console.log('Testing Resend with config:', {
      api_key_partial: API_KEY.substring(0, 5) + '...',
      using_override: !!overrideApiKey
    });

    const resend = new Resend(API_KEY);

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.RESEND.FROM_EMAIL,
      to: testEmail,
      subject: 'Resend Test - HRMS',
      html: '<p>This is a test email sent via Resend!</p>'
    });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Resend test failed',
          config_used: {
            api_key_partial: API_KEY.substring(0, 5) + '...',
            is_overridden: !!overrideApiKey
          },
          details: error,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resend test successful!',
        data,
        config_used: {
          api_key_partial: API_KEY.substring(0, 5) + '...',
          is_overridden: !!overrideApiKey
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Resend test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to test Resend',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
