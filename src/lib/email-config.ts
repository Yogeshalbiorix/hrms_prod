/**
 * Email Configuration
 * Supports both SMTP (local/development) and EmailJS (production)
 */

const getEnv = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

export const RESEND_CONFIG = {
  // Resend Configuration (for production)
  // Get from env vars or use default (fallback) credentials
  API_KEY: getEnv('RESEND_API_KEY', 're_fdXz1xQm_HusjuCPriNuBYwQYJTN7Zix1'),
  FROM_EMAIL: 'onboarding@resend.dev', // Default sender for Resend free tier
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
  HOST: getEnv('SMTP_HOST', 'smtp.gmail.com'),
  PORT: parseInt(getEnv('SMTP_PORT', '587')),
  SECURE: getEnv('SMTP_SECURE') === 'true', // true for 465, false for 587
  AUTH: {
    USER: getEnv('SMTP_USER'),
    PASS: getEnv('SMTP_PASS'),
  },
  FROM_EMAIL: getEnv('SMTP_FROM', 'noreply@hrms.com'),
  FROM_NAME: getEnv('SMTP_FROM_NAME', 'HRMS System'),
};

/**
 * Email Service Type
 * 'smtp' - Use SMTP for local development
 * 'emailjs' - Use EmailJS for production
 * Set via environment variable or auto-detect
 */
export const EMAIL_SERVICE_TYPE = import.meta.env.PROD
  ? 'resend'
  : (getEnv('EMAIL_SERVICE_TYPE') || 'smtp');

export const EMAIL_CONFIG = {
  SERVICE_TYPE: EMAIL_SERVICE_TYPE,
  SMTP: SMTP_CONFIG,
  RESEND: RESEND_CONFIG,
};
