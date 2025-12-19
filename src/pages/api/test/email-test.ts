import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Test EmailJS REST API
    const testEmail = 'test@example.com';
    const testParams = {
      to_email: testEmail,
      to_name: 'Test User',
      subject: 'EmailJS Test',
      message_html: '<p>This is a test email</p>',
      from_name: 'HRMS System',
    };

    const EMAILJS_CONFIG = {
      PUBLIC_KEY: 'LS1lN8SYs5V6vdWUg',
      SERVICE_ID: 'service_rnku77s',
      TEMPLATE_ID: 'template_komoohv',
    };

    console.log('Testing EmailJS with config:', {
      service_id: EMAILJS_CONFIG.SERVICE_ID,
      template_id: EMAILJS_CONFIG.TEMPLATE_ID,
      public_key: EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 5) + '...',
    });

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: testParams,
      }),
    });

    const statusText = response.statusText;
    const status = response.status;

    let responseData;
    try {
      responseData = await response.text();
    } catch {
      responseData = 'No response body';
    }

    if (response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'EmailJS test successful! Email service is working.',
          details: {
            status,
            statusText,
            response: responseData,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'EmailJS test failed',
          details: {
            status,
            statusText,
            response: responseData,
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('EmailJS test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to test EmailJS',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
