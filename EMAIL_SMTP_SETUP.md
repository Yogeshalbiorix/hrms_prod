# SMTP + EmailJS Email Setup Guide

## Overview

Your HRMS now supports **dual email systems**:
- **SMTP** for local development (easy testing)
- **EmailJS** for production (reliable cloud service)

The system automatically switches based on environment!

## Local Development (SMTP)

### Option 1: MailHog (Recommended - Easiest)

MailHog is a fake SMTP server that catches all emails and displays them in a web UI.

#### Install MailHog:

**Windows:**
```powershell
# Download from: https://github.com/mailhog/MailHog/releases

# Or use Chocolatey:
choco install mailhog

# Run MailHog
mailhog
```

**Mac:**
```bash
brew install mailhog
mailhog
```

**Linux:**
```bash
# Download binary
sudo wget -O /usr/local/bin/mailhog https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
sudo chmod +x /usr/local/bin/mailhog

# Run
mailhog
```

#### Configuration:
MailHog runs on `localhost:1025` by default - **no configuration needed!**

#### View Emails:
Open browser: **http://localhost:8025**

All emails will appear here instantly!

### Option 2: Ethereal Email (Online Testing)

Free online fake SMTP service.

1. Go to: https://ethereal.email/create
2. Creates temporary test account automatically
3. Copy credentials to `.env`:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-generated-username
SMTP_PASS=your-generated-password
```

4. View emails at: https://ethereal.email/messages

### Option 3: Gmail SMTP (Real Emails)

Use your Gmail account for testing.

1. Enable 2-Factor Authentication in Gmail
2. Create App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Production (EmailJS)

EmailJS is already configured with your credentials:
```
PUBLIC_KEY: LS1lN8SYs5V6vdWUg
SERVICE_ID: service_rnku77s
TEMPLATE_ID: template_komoohv
```

### Deploy to Production:

1. Set environment variable:
   ```env
   EMAIL_SERVICE_TYPE=emailjs
   # or
   NODE_ENV=production
   ```

2. EmailJS will automatically be used!

## Quick Start (Local)

### Step 1: Install MailHog
```powershell
# Windows (PowerShell as Admin):
choco install mailhog
```

### Step 2: Start MailHog
```powershell
mailhog
```

You'll see:
```
[HTTP] Binding to address: 0.0.0.0:8025
[SMTP] Binding to address: 0.0.0.0:1025
```

### Step 3: Create .env file
```env
EMAIL_SERVICE_TYPE=smtp
```

### Step 4: Test Email
Visit: http://localhost:4321/api/auth/test-reset-email

### Step 5: View Email
Open: http://localhost:8025

**Done!** Your email is there! 🎉

## Configuration Files

### .env (Local Development)
```env
EMAIL_SERVICE_TYPE=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
```

### .env.production (Production)
```env
EMAIL_SERVICE_TYPE=emailjs
NODE_ENV=production
```

## How It Works

### Auto-Detection:
```javascript
// Automatically uses:
// - SMTP when: EMAIL_SERVICE_TYPE=smtp OR NODE_ENV=development
// - EmailJS when: EMAIL_SERVICE_TYPE=emailjs OR NODE_ENV=production
```

### Email Flow (Local):
```
Forgot Password
    ↓
API sends email
    ↓
Nodemailer SMTP
    ↓
MailHog catches email
    ↓
View at http://localhost:8025
```

### Email Flow (Production):
```
Forgot Password
    ↓
API sends email
    ↓
EmailJS REST API
    ↓
Gmail sends email
    ↓
User receives real email
```

## Testing Checklist

### Local Development (SMTP):
- [ ] Start MailHog: `mailhog`
- [ ] Set `.env`: `EMAIL_SERVICE_TYPE=smtp`
- [ ] Visit: http://localhost:4321/api/auth/test-reset-email
- [ ] Check MailHog UI: http://localhost:8025
- [ ] Email appears instantly!

### Production (EmailJS):
- [ ] Set `.env`: `EMAIL_SERVICE_TYPE=emailjs`
- [ ] Test forgot password
- [ ] Check real email inbox
- [ ] Verify EmailJS dashboard

## Troubleshooting

### MailHog Not Receiving Emails?

**Check if MailHog is running:**
```powershell
# You should see:
# [SMTP] Binding to address: 0.0.0.0:1025
```

**Check .env:**
```env
EMAIL_SERVICE_TYPE=smtp  # Must be 'smtp' not 'emailjs'
```

**Check server logs:**
```
📧 Using SMTP email service
✅ Email sent successfully via SMTP
```

### Production Not Sending?

**Set environment:**
```env
EMAIL_SERVICE_TYPE=emailjs
```

**Check EmailJS dashboard:**
https://dashboard.emailjs.com/admin/history

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `EMAIL_SERVICE_TYPE` | `smtp` | Use SMTP (local) |
| `EMAIL_SERVICE_TYPE` | `emailjs` | Use EmailJS (production) |
| `SMTP_HOST` | `localhost` | MailHog default |
| `SMTP_HOST` | `smtp.ethereal.email` | Ethereal Email |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail |
| `SMTP_PORT` | `1025` | MailHog default |
| `SMTP_PORT` | `587` | Standard TLS port |
| `SMTP_PORT` | `465` | SSL port |

## Quick Commands

### Start Local Email Server:
```powershell
# MailHog
mailhog

# View at: http://localhost:8025
```

### Test Password Reset:
```bash
http://localhost:4321/api/auth/test-reset-email
```

### Test OTP:
```bash
http://localhost:4321/otp-test
```

### View All Emails:
```bash
http://localhost:8025
```

## Advantages

### Local Development (SMTP):
✅ No external dependencies  
✅ Instant email viewing  
✅ No API limits  
✅ No internet required  
✅ Perfect for testing  
✅ See all email content  

### Production (EmailJS):
✅ Reliable delivery  
✅ Real emails sent  
✅ Professional service  
✅ Email tracking  
✅ No server management  

## Support

### MailHog:
- Website: https://github.com/mailhog/MailHog
- UI: http://localhost:8025
- SMTP: localhost:1025

### Ethereal:
- Website: https://ethereal.email
- Create account: https://ethereal.email/create

### EmailJS:
- Dashboard: https://dashboard.emailjs.com
- Docs: https://www.emailjs.com/docs

---

**Quick Start Summary:**
1. `choco install mailhog`
2. `mailhog`
3. Create `.env`: `EMAIL_SERVICE_TYPE=smtp`
4. Test: http://localhost:4321/api/auth/test-reset-email
5. View: http://localhost:8025

**Done! 🎉**
