/**
 * API Endpoint for sending email notifications
 */
import type { APIRoute } from 'astro';
import { sendActivityEmail } from '../../../lib/email-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userEmail, userName, activityType, activityDetails } = body;

    // Validate required fields
    if (!userEmail || !userName || !activityType || !activityDetails) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: userEmail, userName, activityType, activityDetails'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate activity type
    const validActivityTypes = [
      'leave_request',
      'regularization',
      'work_from_home',
      'partial_day',
      'leave_approval',
      'leave_rejection'
    ];

    if (!validActivityTypes.includes(activityType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid activity type. Must be one of: ${validActivityTypes.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send email notification
    const emailSent = await sendActivityEmail(
      userEmail,
      userName,
      activityType,
      activityDetails
    );

    if (emailSent) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Email notification sent successfully',
        data: {
          to: userEmail,
          activityType,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send email notification'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
