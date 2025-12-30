import { EMAIL_CONFIG, EMAIL_SERVICE_TYPE } from './email-config';
import { Resend } from 'resend';

const RESEND_CONFIG = EMAIL_CONFIG.RESEND;
const SMTP_CONFIG = EMAIL_CONFIG.SMTP;

/**
 * Send email using Resend API (Cloudflare safe)
 */
async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
  to_name?: string;
}, env?: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to get API key from passed env, then config, then process
    const apiKey = env?.RESEND_API_KEY || RESEND_CONFIG.API_KEY;

    if (!apiKey) {
      console.error('❌ Resend API Key is missing');
      return { success: false, error: 'Resend API Key is missing' };
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: RESEND_CONFIG.FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent via Resend:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('❌ Resend fetch failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Send email using SMTP (Nodemailer) - Local Dev Only
 */
async function sendEmailViaSMTP(params: {
  to: string;
  subject: string;
  html: string;
  to_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic import to avoid bundling issues in Cloudflare
    if (import.meta.env.PROD) {
      throw new Error('SMTP is not supported in production environment');
    }
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.HOST,
      port: SMTP_CONFIG.PORT,
      secure: SMTP_CONFIG.SECURE,
      auth: {
        user: SMTP_CONFIG.AUTH.USER,
        pass: SMTP_CONFIG.AUTH.PASS,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certs in dev
      }
    });

    const info = await transporter.sendMail({
      from: `"${SMTP_CONFIG.FROM_NAME}" <${SMTP_CONFIG.FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log('✅ Email sent via SMTP:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ SMTP Email failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Main email sending function
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  to_name?: string;
}, env?: any): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 Sending email via ${EMAIL_SERVICE_TYPE}...`);

  if (EMAIL_SERVICE_TYPE === 'smtp') {
    return await sendEmailViaSMTP(params);
  } else {
    // Pass env to Resend
    return await sendEmailViaResend(params, env);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetLink: string,
  expiresAt: string,
  env?: any
): Promise<{ success: boolean; error?: string }> {
  const subject = '🔐 Password Reset Request - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Click below to reset your password:</p>
    <p><a href="${resetLink}">Reset Password</a></p>
    <p>This link expires in 1 hour.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    to_name: userName
  }, env);
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  userEmail: string,
  userName: string,
  env?: any
): Promise<{ success: boolean; error?: string }> {
  const subject = '🔐 Password Changed Successfully - HRMS';

  const html = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your password for HRMS has been changed successfully.</p>
    <p>If you did not perform this action, please contact your administrator immediately.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    to_name: userName
  }, env);
}

/**
 * Send leave request acknowledgement email
 */
export async function sendLeaveRequestEmail(
  to: string,
  employeeName: string,
  leave: {
    leave_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
  },
  env?: any
): Promise<{ success: boolean; error?: string }> {
  const subject = `🌴 Leave Request Submitted - ${leave.leave_type}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Leave Request Submitted</h2>
      <p>Hello <strong>${employeeName}</strong>,</p>
      <p>Your leave request has been submitted successfully and is pending approval.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Leave Type:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${leave.leave_type}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Duration:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${leave.start_date} to ${leave.end_date} (${leave.total_days} days)
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${leave.reason}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <span style="background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">
              ${leave.status.toUpperCase()}
            </span>
          </td>
        </tr>
      </table>

      <p>You will receive another email once your request is reviewed.</p>
      <br />
      <p>Best regards,<br />HR Team</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject,
    html,
    to_name: employeeName
  }, env);
}

/**
 * Send leave request status update email (Approved/Rejected)
 */
export async function sendLeaveStatusEmail(
  to: string,
  employeeName: string,
  leave: {
    leave_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
    status: string;
    rejection_reason?: string;
    approved_by?: string;
  },
  env?: any
): Promise<{ success: boolean; error?: string }> {
  const isApproved = leave.status === 'approved';
  const subject = `Leave Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'} - ${leave.leave_type}`;

  const statusColor = isApproved ? '#28a745' : '#dc3545';
  const statusText = leave.status.toUpperCase();

  let html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Leave Request Update</h2>
      <p>Hello <strong>${employeeName}</strong>,</p>
      <p>Your leave request has been <strong>${leave.status}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Leave Type:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${leave.leave_type}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Duration:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${leave.start_date} to ${leave.end_date} (${leave.total_days} days)
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <span style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">
              ${statusText}
            </span>
          </td>
        </tr>
  `;

  if (!isApproved && leave.rejection_reason) {
    html += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Rejection Reason:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #dc3545;">${leave.rejection_reason}</td>
        </tr>
    `;
  }

  if (leave.approved_by) {
    html += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Reviewed By:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${leave.approved_by}</td>
        </tr>
    `;
  }

  html += `
      </table>

      <p>Please contact HR if you have any questions.</p>
      <br />
      <p>Best regards,<br />HR Team</p>
    </div>
  `;

  return await sendEmail({
    to,
    subject,
    html,
    to_name: employeeName
  }, env);
}
