import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email-service';

/* ---------------------------------------------------
   Helper: Generate 6-digit OTP
--------------------------------------------------- */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ---------------------------------------------------
   Helper: Send OTP via Centralized Email Service
--------------------------------------------------- */
async function sendOTPEmail(
  to: string,
  name: string,
  otp: string,
  purpose: string
) {
  const subject =
    purpose === 'registration'
      ? '✅ Verify Your Email - HRMS'
      : purpose === 'password_reset'
        ? '🔐 Password Reset OTP - HRMS'
        : '🔐 Your Login OTP - HRMS';

  const html = `
    <p>Hello <strong>${name}</strong>,</p>

    <p>Your One-Time Password (OTP) is:</p>

    <h2 style="letter-spacing:4px;">${otp}</h2>

    <p>This OTP is valid for <strong>10 minutes</strong>.</p>

    <p>If you did not request this, please ignore this email.</p>

    <p>Regards,<br/><strong>HRMS Team</strong></p>
  `;

  await sendEmail({
    to,
    subject,
    html,
    to_name: name
  });
}

/* ---------------------------------------------------
   POST /api/resend-otp
--------------------------------------------------- */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return json(400, { message: 'Invalid JSON body' });

    const { email, name, purpose = 'login' } = body;

    if (!email || !name) {
      return json(400, {
        success: false,
        message: 'Email and name are required'
      });
    }

    const otp = generateOTP();

    // TODO (Recommended):
    // Store OTP in DB / Cloudflare KV with expiry
    // For now we only send email

    await sendOTPEmail(email, name, otp, purpose);

    return json(200, {
      success: true,
      message: 'OTP resent successfully'
      // otp intentionally NOT returned in production
    });

  } catch (error) {
    console.error('Error in resend-otp API:', error);
    return json(500, {
      success: false,
      message: 'Internal server error'
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
