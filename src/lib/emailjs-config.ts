/**
 * EmailJS Configuration
 * 
 * Setup Instructions:
 * 1. Create a free account at https://www.emailjs.com/
 * 2. Add an email service (Gmail, Outlook, etc.)
 * 3. Create email templates for different notifications
 * 4. Copy your credentials below
 */

export const EMAILJS_CONFIG = {
  // Get these from your EmailJS dashboard
  PUBLIC_KEY: 'LS1lN8SYs5V6vdWUg',  // Get from Account > API Keys
  SERVICE_ID: 'service_rnku77s',   // Get from Email Services
  TEMPLATE_ID: 'template_komoohv', // Get from Email Templates
};

/**
 * Template IDs for different email types
 * Create separate templates in EmailJS for each type
 */
export const EMAIL_TEMPLATES = {
  LEAVE_REQUEST: 'template_leave_request',
  WORK_FROM_HOME: 'template_wfh',
  REGULARIZATION: 'template_regularization',
  PARTIAL_DAY: 'template_partial_day',
  LEAVE_APPROVAL: 'template_leave_approval',
  LEAVE_REJECTION: 'template_leave_rejection',
  PASSWORD_RESET: 'template_password_reset',
};
