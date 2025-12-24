/**
 * API Endpoint for sending email notifications (Cloudflare compatible)
 */
import type { APIRoute } from 'astro';
import { EMAIL_CONFIG } from '../../../lib/email-config';

const EMAILJS_CONFIG = EMAIL_CONFIG.EMAILJS;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return json(400, { error: 'Invalid JSON body' });
    }

    const { userEmail, userName, activityType, activityDetails } = body;

    if (!userEmail || !userName || !activityType || !activityDetails) {
      return json(400, {
        error: 'Missing required fields'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return json(400, { error: 'Invalid email format' });
    }

    const subject = `📢 HRMS Notification: ${activityType.replace('_', ' ')}`;

    const html = `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>You have a new HRMS notification.</p>
      <pre>${JSON.stringify(activityDetails, null, 2)}</pre>
      <p>Regards,<br/>HRMS System</p>
    `;

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: {
          to_email: userEmail,
          to_name: userName,
          subject,
          message_html: html,
          from_name: 'HRMS System'
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('EmailJS error:', err);
      return json(500, { error: 'Failed to send email' });
    }

    return json(200, {
      success: true,
      message: 'Email notification sent',
      to: userEmail,
      activityType
    });

  } catch (error: any) {
    console.error('Send notification error:', error);
    return json(500, { error: 'Internal server error' });
  }
};

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
