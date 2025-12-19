/**
 * Email Configuration
 * Supports both SMTP (local/development) and EmailJS (production)
 */

export const EMAILJS_CONFIG = {
  // EmailJS Configuration (for production)
  PUBLIC_KEY: 'LS1lN8SYs5V6vdWUg',
  SERVICE_ID: 'service_rnku77s',
  TEMPLATE_ID: 'template_komoohv',
};

/**
 * SMTP Configuration (for local development)
 * Using Nodemailer for local SMTP
 * 
 * For Gmail SMTP:
 * - HOST: smtp.gmail.com
 * - PORT: 587 (TLS) or 465 (SSL)
 * - USER: your Gmail address
 * - PASS: your Gmail App Password (not regular password)
 * 
 * To get Gmail App Password:
 * 1. Go to Google Account settings
 * 2. Security > 2-Step Verification
 * 3. App passwords > Generate new app password
 */
export const SMTP_CONFIG = {
  // Use environment variable or default to Gmail SMTP
  HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  PORT: parseInt(process.env.SMTP_PORT || '587'),
  SECURE: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  AUTH: {
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
  },
  FROM_EMAIL: process.env.SMTP_FROM || 'noreply@hrms.com',
  FROM_NAME: process.env.SMTP_FROM_NAME || 'HRMS System',
};

/**
 * Email Service Type
 * 'smtp' - Use SMTP for local development
 * 'emailjs' - Use EmailJS for production
 * Set via environment variable or auto-detect
 */
export const EMAIL_SERVICE_TYPE = process.env.EMAIL_SERVICE_TYPE ||
  (process.env.NODE_ENV === 'production' ? 'emailjs' : 'smtp');

export const EMAIL_CONFIG = {
  SERVICE_TYPE: EMAIL_SERVICE_TYPE,
  SMTP: SMTP_CONFIG,
  EMAILJS: EMAILJS_CONFIG,
};
