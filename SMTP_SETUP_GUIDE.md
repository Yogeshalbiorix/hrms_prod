# SMTP Email Setup Guide

## Quick Setup (Gmail SMTP)

The system is now configured to use SMTP for local development. Follow these steps to set up Gmail SMTP:

### Step 1: Enable 2-Step Verification

1. Go to your Google Account:   
2. Click on **Security** in the left menu
3. Scroll to **2-Step Verification**
4. If not enabled, enable it now

### Step 2: Generate App Password

1. Go to **Security** > **2-Step Verification**
2. Scroll down to **App passwords**
3. Click **App passwords** (you may need to sign in again)
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter name: **HRMS Local**
7. Click **Generate**
8. **Copy the 16-character password** (spaces will be removed automatically)

### Step 3: Update .env File

Open the `.env` file in the project root and update these values:

```env
# Replace with your Gmail address
SMTP_USER=your-email@gmail.com

# Replace with the App Password from Step 2
SMTP_PASS=your-16-char-app-password

# Use the same Gmail address
SMTP_FROM=your-email@gmail.com
```

**Example:**
```env
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=john.doe@gmail.com
```

### Step 4: Restart Dev Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Test Email

1. Go to login page: http://localhost:3000
2. Click **"Forgot Password"**
3. Enter email: `admin@hrms.com`
4. Submit
5. **Check your Gmail inbox** for the password reset email

## Alternative SMTP Providers

### Option 1: Outlook/Hotmail SMTP

Update `.env`:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-outlook-password
SMTP_FROM=your-email@outlook.com
```

### Option 2: Mailtrap (Testing Only)

Mailtrap is perfect for testing - it captures all emails without sending them.

1. Sign up at https://mailtrap.io (free)
2. Create an inbox
3. Copy SMTP credentials
4. Update `.env`:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM=noreply@hrms.com
```

### Option 3: SendGrid SMTP

1. Sign up at https://sendgrid.com (100 emails/day free)
2. Create API Key
3. Update `.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=your-verified-sender@yourdomain.com
```

## Current Configuration

The system is configured with:
- **Service Type:** SMTP (for development)
- **Default Host:** smtp.gmail.com
- **Default Port:** 587 (TLS)
- **Environment File:** `.env`

## Troubleshooting

### "Authentication failed" or "Invalid credentials"

**Solution:** Make sure you're using an App Password, not your regular Gmail password.

1. Go to Google Account > Security
2. Enable 2-Step Verification if not enabled
3. Generate new App Password
4. Update `.env` with the new password
5. Restart dev server

### "Connection timeout" or "ECONNREFUSED"

**Solution:** Check your firewall/antivirus settings

1. Make sure port 587 is not blocked
2. Try port 465 with SECURE=true:
   ```env
   SMTP_PORT=465
   SMTP_SECURE=true
   ```
3. Check if your network allows SMTP connections

### "Email not received" but no errors

**Possible causes:**
1. Email in spam folder - check spam/junk
2. Wrong recipient email
3. Gmail may delay emails - wait 1-2 minutes

**Check terminal logs:**
```
✅ Email sent successfully via SMTP
📧 Message ID: <message-id>
```

### "Less secure app access" error (Old Gmail accounts)

Gmail removed "Less secure app access" in May 2022. You MUST use App Passwords now.

1. Enable 2-Step Verification
2. Generate App Password
3. Use App Password in SMTP_PASS

## Testing Without Email

If you don't want to configure SMTP right now, you can still test:

1. Use the dev reset link from console:
   - Request password reset
   - Open browser console (F12)
   - Look for: `🔗 Development Reset Link: http://...`
   - Copy and paste the link

2. Use the API test endpoint:
   ```
   http://localhost:3000/api/test/email-test
   ```

## Security Notes

### ⚠️ IMPORTANT: Never commit .env file

The `.env` file contains your email password. Make sure it's in `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

### ✅ Use App Passwords, not regular passwords

Never use your actual Gmail password. Always generate App Passwords for applications.

### ✅ Different passwords for different apps

Generate separate App Passwords for different applications. If one is compromised, you can revoke it without affecting others.

## Production Deployment

For production, consider using:
- **EmailJS** - Already configured, just needs credentials
- **SendGrid** - Reliable, good free tier
- **AWS SES** - Best for high volume
- **Postmark** - Excellent deliverability

Update `.env` for production:
```env
EMAIL_SERVICE_TYPE=emailjs
```

## Verification

To verify SMTP is working:

1. **Check terminal output:**
   ```
   📧 Using SMTP email service
   ✅ Email sent successfully via SMTP
   📧 Message ID: <...>
   ```

2. **Check console logs:**
   - Should show email sending status
   - Should display reset link (dev mode)

3. **Check inbox:**
   - Look for email from SMTP_FROM address
   - Check spam folder if not in inbox

## Quick Reference

**Gmail SMTP:**
- Host: `smtp.gmail.com`
- Port: `587` (TLS) or `465` (SSL)
- User: Your Gmail address
- Pass: App Password (not regular password)

**Outlook SMTP:**
- Host: `smtp-mail.outlook.com`
- Port: `587`
- User: Your Outlook address
- Pass: Your Outlook password

**Mailtrap (Testing):**
- Host: `smtp.mailtrap.io`
- Port: `2525`
- User: Mailtrap username
- Pass: Mailtrap password

## Support

If you continue having issues:
1. Check the terminal logs for error messages
2. Verify your credentials in `.env`
3. Test with Mailtrap first (easier setup)
4. Make sure 2-Step Verification is enabled (Gmail)
5. Generate a new App Password
