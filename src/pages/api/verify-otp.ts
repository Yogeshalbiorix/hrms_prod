import type { APIRoute } from 'astro';

/**
 * API endpoint to verify OTP
 * POST /api/verify-otp
 *
 * NOTE:
 * Cloudflare Pages is stateless.
 * OTP verification must be done using D1 / KV.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return json(400, {
        valid: false,
        message: 'Invalid JSON body'
      });
    }

    const { email, otp } = body;

    if (!email || !otp) {
      return json(400, {
        valid: false,
        message: 'Email and OTP are required'
      });
    }

    /* ---------------------------------------------------
       TODO: Implement OTP verification
       - Fetch OTP from D1 / KV by email
       - Check expiry
       - Match OTP
       - Mark OTP as used
    --------------------------------------------------- */

    // TEMP response (until storage is added)
    console.warn('⚠️ OTP verification not implemented yet');

    return json(200, {
      valid: true,
      message: 'OTP verified successfully (temporary response)'
    });

  } catch (error: any) {
    console.error('Error in verify-otp API:', error);
    return json(500, {
      valid: false,
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
