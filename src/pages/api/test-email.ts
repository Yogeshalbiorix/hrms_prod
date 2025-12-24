import type { APIRoute } from 'astro';
import { sendEmail, sendPasswordResetEmail } from '../../lib/email-service';

/* ---------------------------------------------------
   Helper: Send test OTP email via Centralized Service
--------------------------------------------------- */
async function sendTestEmail(
  to: string,
  name: string
) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const subject = '🧪 Test Email - HRMS (Unified Service)';
  const html = `
    <p>Hello <strong>${name}</strong>,</p>

    <p>This is a <strong>test email</strong> to verify the Unified Email Service (Resend/SMTP).</p>

    <p>Your test OTP is:</p>

    <h2 style="letter-spacing:5px;">${otp}</h2>

    <p>If you received this email, the system is working correctly ✅</p>

    <p>Regards,<br/><strong>HRMS Team</strong></p>
  `;

  const result = await sendEmail({
    to,
    subject,
    html,
    to_name: name
  });

  return result;
}

/* ---------------------------------------------------
   GET /api/test/email-test
--------------------------------------------------- */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'otp'; // 'otp' or 'reset'
    const email = url.searchParams.get('email') || 'yogesh.albiorix@gmail.com';

    console.log(`🧪 Testing Email (${type}) to ${email}...`);

    let result;

    if (type === 'reset') {
      result = await sendPasswordResetEmail(
        email,
        'Test User',
        'https://example.com/reset-password?token=test-token',
        new Date(Date.now() + 3600000).toISOString()
      );
    } else {
      result = await sendTestEmail(email, 'Test User');
    }

    if (result.success) {
      return json(200, {
        success: true,
        message: '✅ Email sent successfully!',
        details: `Sent ${type} email via Unified Service`,
        debug: result
      });
    }

    return json(500, {
      success: false,
      message: '❌ Failed to send test email',
      error: result.error,
      debug: result
    });

  } catch (error: any) {
    console.error('Error in test-email API:', error);
    return json(500, {
      success: false,
      message: 'Internal server error',
      error: error.message || 'Unknown error'
    });
  }
};

/* ---------------------------------------------------
   Helper
--------------------------------------------------- */
function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
