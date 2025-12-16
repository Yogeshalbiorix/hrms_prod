/**
 * Email Notification Service
 * Supports both SMTP (local/development) and EmailJS (production)
 */

import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from './email-config';
import nodemailer from 'nodemailer';

// For backward compatibility
const EMAILJS_CONFIG = EMAIL_CONFIG.EMAILJS;

// Initialize EmailJS with your public key (browser only)
if (typeof window !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

/**
 * Create SMTP transporter (for local development)
 */
let smtpTransporter: any = null;

function getSMTPTransporter() {
  if (!smtpTransporter) {
    const config = EMAIL_CONFIG.SMTP;

    // If no auth provided, create ethereal test account
    if (!config.AUTH.USER) {
      console.log('📧 Using SMTP without authentication (local mail server)');
    }

    smtpTransporter = nodemailer.createTransport({
      host: config.HOST,
      port: config.PORT,
      secure: config.SECURE,
      auth: config.AUTH.USER ? {
        user: config.AUTH.USER,
        pass: config.AUTH.PASS,
      } : undefined,
      tls: {
        rejectUnauthorized: false // For local development
      }
    });
  }
  return smtpTransporter;
}

/**
 * Send email using SMTP (for local development)
 */
async function sendEmailViaSMTP(params: {
  to: string;
  subject: string;
  html: string;
  to_name?: string;
}): Promise<boolean> {
  try {
    const transporter = getSMTPTransporter();
    const config = EMAIL_CONFIG.SMTP;

    const info = await transporter.sendMail({
      from: `"${config.FROM_NAME}" <${config.FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log('✅ Email sent successfully via SMTP');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info) || 'N/A');

    return true;
  } catch (error) {
    console.error('❌ Failed to send email via SMTP:', error);
    return false;
  }
}

/**
 * Send email using EmailJS REST API (works on server-side)
 */
async function sendEmailViaRestAPI(templateParams: any): Promise<boolean> {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via EmailJS REST API');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ EmailJS REST API error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send email via EmailJS REST API:', error);
    return false;
  }
}

/**
 * Send email using configured service (SMTP or EmailJS)
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  to_name?: string;
}): Promise<boolean> {
  const serviceType = EMAIL_CONFIG.SERVICE_TYPE;

  console.log(`📧 Using ${serviceType.toUpperCase()} email service`);

  if (serviceType === 'smtp') {
    // Use SMTP for local development
    return await sendEmailViaSMTP(params);
  } else {
    // Use EmailJS for production
    const templateParams = {
      to_email: params.to,
      to_name: params.to_name || params.to,
      subject: params.subject,
      message_html: params.html,
      from_name: 'HRMS System',
    };
    return await sendEmailViaRestAPI(templateParams);
  }
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  activityType: 'leave_request' | 'regularization' | 'work_from_home' | 'partial_day' | 'leave_approval' | 'leave_rejection' | 'otp_verification' | 'email_verification';
  userName: string;
  activityDetails: any;
}

/**
 * OTP Storage Interface
 */
export interface OTPData {
  email: string;
  otp: string;
  expiresAt: Date;
  purpose: 'login' | 'registration' | 'password_reset' | 'email_verification';
  verified: boolean;
}

// In-memory OTP storage (in production, use a database or Redis)
const otpStorage = new Map<string, OTPData>();

/**
 * Email templates for different activity types
 */
export const emailTemplates = {
  leave_request: (data: any) => ({
    subject: `Leave Request Submitted - ${data.leave_type}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #667eea; }
          .value { color: #333; margin-left: 10px; }
          .status-badge { display: inline-block; padding: 5px 15px; background: #ffa500; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏖️ Leave Request Submitted</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Your leave request has been successfully submitted and is now <span class="status-badge">PENDING APPROVAL</span></p>
            
            <div class="detail-row">
              <span class="label">📋 Leave Type:</span>
              <span class="value">${data.leave_type}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">📅 Start Date:</span>
              <span class="value">${new Date(data.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">📅 End Date:</span>
              <span class="value">${new Date(data.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">⏱️ Total Days:</span>
              <span class="value">${data.total_days} day(s)</span>
            </div>
            
            ${data.reason ? `
            <div class="detail-row">
              <span class="label">💬 Reason:</span>
              <span class="value">${data.reason}</span>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl || '#'}" class="button">View Dashboard</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              You will receive another email once your leave request is reviewed by your manager.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  work_from_home: (data: any) => ({
    subject: `Work From Home Request - ${data.date}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #4facfe; }
          .value { color: #333; margin-left: 10px; }
          .status-badge { display: inline-block; padding: 5px 15px; background: #4facfe; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Work From Home Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Your work from home request has been submitted successfully! <span class="status-badge">SUBMITTED</span></p>
            
            <div class="detail-row">
              <span class="label">📅 Date:</span>
              <span class="value">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            ${data.reason ? `
            <div class="detail-row">
              <span class="label">💬 Reason:</span>
              <span class="value">${data.reason}</span>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl || '#'}" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  partial_day: (data: any) => ({
    subject: `Partial Day Request - ${data.date}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #f5576c; }
          .value { color: #333; margin-left: 10px; }
          .status-badge { display: inline-block; padding: 5px 15px; background: #f5576c; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Partial Day Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Your partial day request has been submitted! <span class="status-badge">PENDING</span></p>
            
            <div class="detail-row">
              <span class="label">📅 Date:</span>
              <span class="value">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">⏰ Time:</span>
              <span class="value">${data.start_time} - ${data.end_time}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">⏱️ Duration:</span>
              <span class="value">${data.duration} hours</span>
            </div>
            
            ${data.reason ? `
            <div class="detail-row">
              <span class="label">💬 Reason:</span>
              <span class="value">${data.reason}</span>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl || '#'}" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  regularization: (data: any) => ({
    subject: `Attendance Regularization Request - ${data.date}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #38f9d7; }
          .value { color: #333; margin-left: 10px; }
          .status-badge { display: inline-block; padding: 5px 15px; background: #43e97b; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #43e97b; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Attendance Regularization Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Your attendance regularization request has been submitted! <span class="status-badge">PENDING</span></p>
            
            <div class="detail-row">
              <span class="label">📅 Date:</span>
              <span class="value">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">⏰ Clock In:</span>
              <span class="value">${data.clock_in}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">⏰ Clock Out:</span>
              <span class="value">${data.clock_out}</span>
            </div>
            
            ${data.reason ? `
            <div class="detail-row">
              <span class="label">💬 Reason:</span>
              <span class="value">${data.reason}</span>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl || '#'}" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  leave_approval: (data: any) => ({
    subject: `✅ Leave Request Approved - ${data.leave_type}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #52c41a; }
          .value { color: #333; margin-left: 10px; }
          .status-badge { display: inline-block; padding: 5px 15px; background: #52c41a; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #52c41a; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Leave Request Approved</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Great news! Your leave request has been <span class="status-badge">APPROVED</span></p>
            
            <div class="detail-row">
              <span class="label">📋 Leave Type:</span>
              <span class="value">${data.leave_type}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">📅 Period:</span>
              <span class="value">${new Date(data.start_date).toLocaleDateString()} - ${new Date(data.end_date).toLocaleDateString()}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">⏱️ Total Days:</span>
              <span class="value">${data.total_days} day(s)</span>
            </div>
            
            <div class="detail-row">
              <span class="label">👤 Approved By:</span>
              <span class="value">${data.approved_by}</span>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl || '#'}" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  leave_rejection: (data: any) => ({
    subject: `❌ Leave Request Rejected - ${data.leave_type}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #ff4d4f; }
          .value { color: #333; margin-left: 10px; }
          .status-badge { display: inline-block; padding: 5px 15px; background: #ff4d4f; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ff4d4f; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Leave Request Rejected</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${data.userName}</strong>,</p>
            <p>Unfortunately, your leave request has been <span class="status-badge">REJECTED</span></p>
            
            <div class="detail-row">
              <span class="label">📋 Leave Type:</span>
              <span class="value">${data.leave_type}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">📅 Period:</span>
              <span class="value">${new Date(data.start_date).toLocaleDateString()} - ${new Date(data.end_date).toLocaleDateString()}</span>
            </div>
            
            ${data.rejection_reason ? `
            <div class="detail-row">
              <span class="label">💬 Rejection Reason:</span>
              <span class="value">${data.rejection_reason}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="label">👤 Reviewed By:</span>
              <span class="value">${data.approved_by}</span>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              You can contact your manager for more information or submit a new request.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.dashboardUrl || '#'}" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

/**
 * Generate email content based on activity type
 */
export function generateEmailContent(
  activityType: EmailNotification['activityType'],
  data: any
): { subject: string; html: string } {
  // Filter out OTP-specific types that don't have templates
  if (activityType === 'otp_verification' || activityType === 'email_verification') {
    throw new Error(`OTP types should use sendOTPEmail function instead`);
  }

  const template = emailTemplates[activityType as keyof typeof emailTemplates];
  if (!template) {
    throw new Error(`Unknown activity type: ${activityType}`);
  }
  return template(data);
}

/**
 * Send email notification using EmailJS
 */
export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  try {
    console.log('📧 Sending Email via EmailJS:', {
      to: notification.to,
      subject: notification.subject,
      activityType: notification.activityType,
      timestamp: new Date().toISOString()
    });

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY' ||
      EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID' ||
      EMAILJS_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      console.warn('⚠️ EmailJS not configured. Please update src/lib/emailjs-config.ts');
      console.log('📧 Email would be sent to:', notification.to);
      console.log('📧 Subject:', notification.subject);
      return false;
    }

    // Send email using configured service (SMTP or EmailJS)
    if (typeof window === 'undefined') {
      // Server-side: use configured email service
      return await sendEmail({
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
        to_name: notification.userName,
      });
    } else {
      // Browser-side: use EmailJS browser SDK
      const templateParams = {
        to_email: notification.to,
        to_name: notification.userName,
        subject: notification.subject,
        message_html: notification.html,
        activity_type: notification.activityType,
        from_name: 'HRMS System',
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );
      console.log('✅ Email sent successfully:', response.status, response.text);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to send email via EmailJS:', error);
    return false;
  }
}

/**
 * Send activity notification email
 */
export async function sendActivityEmail(
  userEmail: string,
  userName: string,
  activityType: EmailNotification['activityType'],
  activityDetails: any
): Promise<boolean> {
  try {
    const { subject, html } = generateEmailContent(activityType, {
      ...activityDetails,
      userName,
      dashboardUrl: activityDetails.dashboardUrl || 'https://your-hrms-domain.com/dashboard'
    });

    const notification: EmailNotification = {
      to: userEmail,
      subject,
      html,
      activityType,
      userName,
      activityDetails
    };

    return await sendEmailNotification(notification);
  } catch (error) {
    console.error('Failed to send activity email:', error);
    return false;
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
): Promise<boolean> {
  try {
    const expiryDate = new Date(expiresAt);
    const expiryTime = expiryDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = '🔐 Password Reset Request - HRMS';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #ee5a6f; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
          .security-note { background: #e3f2fd; padding: 15px; border-radius: 4px; margin-top: 20px; font-size: 13px; }
          .link-box { background: white; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; margin: 15px 0; border: 1px dashed #ccc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>We received a request to reset your password for your HRMS account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Your Password</a>
            </div>
            
            <div class="alert-box">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour (at ${expiryTime})
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-box">
              ${resetLink}
            </div>
            
            <div class="security-note">
              <strong>🛡️ Security Tips:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will not change until you access the link and create a new one</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              If you didn't request a password reset, please ignore this email or contact your administrator if you have concerns about your account security.
            </p>
          </div>
          <div class="footer">
            <p><strong>This is an automated security message from HRMS.</strong></p>
            <p>Please do not reply to this email. If you need assistance, contact your HR department.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Sending password reset email to:', userEmail);
    console.log('🔗 Reset link:', resetLink);

    // Send email using configured service (SMTP for local, EmailJS for production)
    const success = await sendEmail({
      to: userEmail,
      subject: subject,
      html: html,
      to_name: userName,
    });

    return success;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP with expiration time
 */
export function storeOTP(
  email: string,
  otp: string,
  purpose: OTPData['purpose'],
  expiryMinutes: number = 10
): void {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  otpStorage.set(email, {
    email,
    otp,
    expiresAt,
    purpose,
    verified: false
  });

  console.log(`🔐 OTP stored for ${email}, expires at ${expiresAt.toLocaleString()}`);
}

/**
 * Verify OTP
 */
export function verifyOTP(email: string, otp: string): { valid: boolean; message: string } {
  const stored = otpStorage.get(email);

  if (!stored) {
    return { valid: false, message: 'No OTP found for this email. Please request a new OTP.' };
  }

  if (stored.verified) {
    return { valid: false, message: 'OTP already used. Please request a new OTP.' };
  }

  if (new Date() > stored.expiresAt) {
    otpStorage.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  if (stored.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please check and try again.' };
  }

  // Mark as verified
  stored.verified = true;
  otpStorage.set(email, stored);

  // Auto-delete after 1 minute
  setTimeout(() => {
    otpStorage.delete(email);
  }, 60000);

  return { valid: true, message: 'OTP verified successfully!' };
}

/**
 * Check if OTP exists and is valid
 */
export function hasValidOTP(email: string): boolean {
  const stored = otpStorage.get(email);
  if (!stored || stored.verified) return false;
  return new Date() <= stored.expiresAt;
}

/**
 * Clear OTP for email
 */
export function clearOTP(email: string): void {
  otpStorage.delete(email);
}

/**
 * Send OTP email for login/authentication
 */
export async function sendOTPEmail(
  userEmail: string,
  userName: string,
  purpose: OTPData['purpose'] = 'login',
  expiryMinutes: number = 10
): Promise<{ success: boolean; otp?: string; message: string }> {
  try {
    // Generate OTP
    const otp = generateOTP();

    // Store OTP
    storeOTP(userEmail, otp, purpose, expiryMinutes);

    const subject = purpose === 'login'
      ? '🔐 Your Login OTP - HRMS'
      : purpose === 'registration'
        ? '✅ Verify Your Email - HRMS'
        : purpose === 'email_verification'
          ? '📧 Email Verification Code - HRMS'
          : '🔒 Password Reset OTP - HRMS';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; margin: 30px 0; border-radius: 10px; text-align: center; }
          .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f9f9f9; text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
          .icon { font-size: 48px; margin-bottom: 10px; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔐</div>
            <h1>Verification Code</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>${purpose === 'login'
        ? 'You have requested to login to your HRMS account. Here is your One-Time Password (OTP):'
        : purpose === 'registration'
          ? 'Thank you for registering! Please verify your email address with this code:'
          : purpose === 'email_verification'
            ? 'Please verify your email address with this verification code:'
            : 'You have requested to reset your password. Here is your verification code:'
      }</p>
            
            <div class="otp-box">
              <div style="font-size: 14px; margin-bottom: 10px;">Your OTP Code</div>
              <div class="otp-code">${otp}</div>
              <div style="font-size: 14px; margin-top: 10px;">Valid for ${expiryMinutes} minutes</div>
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This OTP will expire in <strong>${expiryMinutes} minutes</strong></li>
                <li>Do not share this code with anyone</li>
                <li>Use this code only on the official HRMS platform</li>
              </ul>
            </div>
            
            <div class="info-box">
              <strong>🛡️ Security Tips:</strong>
              <ul>
                <li>HRMS will never ask for your OTP via phone or email</li>
                <li>If you didn't request this OTP, please ignore this email</li>
                <li>Contact your administrator if you have security concerns</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
            </p>
          </div>
          <div class="footer">
            <p><strong>This is an automated security message from HRMS.</strong></p>
            <p>Please do not reply to this email. If you need assistance, contact your HR department.</p>
            <p>&copy; ${new Date().getFullYear()} HRMS - Human Resource Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Sending OTP email to:', userEmail);
    console.log('🔢 Generated OTP:', otp);

    // Check if EmailJS is properly configured
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY' ||
      EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID' ||
      EMAILJS_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      console.warn('⚠️ EmailJS not configured. Please update src/lib/emailjs-config.ts');
      console.log('📧 OTP email would be sent to:', userEmail);
      console.log('🔢 OTP Code:', otp);
      return {
        success: false,
        otp: otp, // Return OTP for testing purposes when not configured
        message: 'EmailJS not configured. Check console for OTP.'
      };
    }

    // Send email using configured service (SMTP or EmailJS)
    let success = false;
    if (typeof window === 'undefined') {
      // Server-side: use configured email service
      success = await sendEmail({
        to: userEmail,
        subject: subject,
        html: html,
        to_name: userName,
      });
    } else {
      // Browser-side: use EmailJS browser SDK
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        subject: subject,
        message_html: html,
        otp_code: otp,
        expiry_minutes: expiryMinutes,
        from_name: 'HRMS System',
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );
      console.log('✅ OTP email sent successfully:', response.status);
      success = true;
    }

    return {
      success: success,
      message: success ? `OTP sent successfully to ${userEmail}` : 'Failed to send OTP email'
    };
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return {
      success: false,
      message: 'Failed to send OTP email. Please try again.'
    };
  }
}

/**
 * Resend OTP
 */
export async function resendOTP(
  userEmail: string,
  userName: string,
  purpose: OTPData['purpose'] = 'login'
): Promise<{ success: boolean; message: string }> {
  // Clear existing OTP
  clearOTP(userEmail);

  // Send new OTP
  return await sendOTPEmail(userEmail, userName, purpose);
}
