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
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(RESEND_CONFIG.API_KEY);

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
}): Promise<{ success: boolean; error?: string }> {
  console.log(`📧 Sending email via ${EMAIL_SERVICE_TYPE}...`);

  if (EMAIL_SERVICE_TYPE === 'smtp') {
    return await sendEmailViaSMTP(params);
  } else {
    return await sendEmailViaResend(params);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetLink: string,
  expiresAt: string
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
  });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  userEmail: string,
  userName: string
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
  });
}
