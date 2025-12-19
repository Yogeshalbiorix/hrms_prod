# Email Functionality Testing Guide

## Issue Fixed

The email service was configured to use SMTP (localhost:1025) in development, but no local SMTP server was running. Changed to use EmailJS REST API for both development and production.

## Changes Made

1. ✅ **Email Config Updated** - Changed `EMAIL_SERVICE_TYPE` to always use `emailjs`
2. ✅ **Dev Mode Reset Link** - Forgot password now returns the reset link in the response (dev only)
3. ✅ **Email Test Endpoint** - Created `/api/test/email-test` to verify EmailJS credentials

## EmailJS Configuration

**Current Settings:**
- **Public Key:** `LS1lN8SYs5V6vdWUg`
- **Service ID:** `service_rnku77s`
- **Template ID:** `template_komoohv`

## How to Test Email Functionality

### Option 1: Test EmailJS Connection
1. Open browser and go to: `http://localhost:3000/api/test/email-test`
2. You should see either:
   - ✅ Success: EmailJS is configured correctly
   - ❌ Error: EmailJS credentials need to be updated

### Option 2: Test Forgot Password with Dev Link
1. Go to the login page
2. Click "Forgot Password"
3. Enter email: `admin@hrms.com`
4. Submit the form
5. **Check Browser Console** - The reset link will be logged there
6. **Check Terminal** - The reset link will also appear in the server logs
7. Copy the reset link and paste in browser to test password reset

### Option 3: Check Email Inbox (if EmailJS is configured)
If your EmailJS account is properly set up with an email service:
1. Request password reset
2. Check the inbox of the email address you entered
3. Click the reset link in the email

## EmailJS Setup (if emails not working)

If emails are still not being sent, you need to configure EmailJS:

### Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for free account (300 emails/month free)
3. Verify your email

### Step 2: Add Email Service
1. Go to **Email Services** section
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended)
4. Follow the setup wizard
5. Note the **Service ID** (e.g., `service_xxx`)

### Step 3: Create Email Template
1. Go to **Email Templates** section
2. Click **Create New Template**
3. Use this template structure:

**Template Name:** Password Reset

**Subject:** Password Reset Request - HRMS

**Content:**
```
Hello {{to_name}},

{{message_html}}

---
HRMS System
```

4. Note the **Template ID** (e.g., `template_xxx`)

### Step 4: Get Public Key
1. Go to **Account** > **General**
2. Find your **Public Key** (e.g., `user_xxx`)

### Step 5: Update Configuration
Update the file `src/lib/emailjs-config.ts`:

```typescript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'your_public_key_here',
  SERVICE_ID: 'your_service_id_here',
  TEMPLATE_ID: 'your_template_id_here',
};
```

### Step 6: Test Again
1. Restart the dev server: `npm run dev`
2. Test the email functionality again

## Development Mode Features

When testing in development:
- ✅ Reset link is logged to browser console
- ✅ Reset link is logged to terminal
- ✅ Reset link is included in API response (check Network tab)
- ✅ Token is valid for 1 hour

## Production Considerations

In production:
- ❌ Reset link is NOT exposed in API response
- ❌ Token details are NOT logged
- ✅ Email is sent via EmailJS
- ✅ Token expires in 1 hour
- ✅ Token can only be used once

## Troubleshooting

### "Email not received"
1. Check EmailJS dashboard for email quota
2. Check spam/junk folder
3. Verify email service is connected in EmailJS
4. Use the dev reset link from console instead

### "Invalid EmailJS credentials"
1. Visit `/api/test/email-test` to verify configuration
2. Update credentials in `src/lib/emailjs-config.ts`
3. Restart dev server

### "Token expired"
1. Request a new password reset
2. Tokens expire after 1 hour
3. Use the link quickly after requesting

## Current Database State

After the latest fixes:
- ✅ `password_reset_tokens` table exists
- ✅ `user_audit_log` table exists
- ✅ Admin user: `admin` / `admin123`
- ✅ All auth APIs working

## Next Steps

1. Test email by visiting: `http://localhost:3000/api/test/email-test`
2. If test fails, update EmailJS credentials
3. Try forgot password flow
4. Check console for reset link
5. Test password reset with the link
