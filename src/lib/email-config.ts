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
 */
export const SMTP_CONFIG = {
  // Use environment variable or default to localhost
  HOST: process.env.SMTP_HOST || 'localhost',
  PORT: parseInt(process.env.SMTP_PORT || '1025'),
  SECURE: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  AUTH: {
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
  },
  FROM_EMAIL: process.env.SMTP_FROM || 'noreply@hrms-local.com',
  FROM_NAME: process.env.SMTP_FROM_NAME || 'HRMS System (Local)',
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
