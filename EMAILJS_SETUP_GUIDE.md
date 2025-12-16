# EmailJS Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Add Email Service
1. Go to **Email Services** in the dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended)
4. For Gmail:
   - Click on **Gmail**
   - Click **Connect Account**
   - Sign in with your Gmail account (yogesh.albiorix@gmail.com)
   - Allow EmailJS to send emails on your behalf
5. Copy the **Service ID** (looks like `service_xxxxxxx`)

### Step 3: Create Email Template
1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Set up the template:
   - **Template Name**: HRMS Notifications
   - **Subject**: `{{subject}}`
   - **Content**: Use this HTML template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <div>
    <p>Dear {{to_name}},</p>
    <div>{{{message_html}}}</div>
    <p>Best regards,<br>{{from_name}}</p>
  </div>
</body>
</html>
```

4. Click **Save**
5. Copy the **Template ID** (looks like `template_xxxxxxx`)

### Step 4: Get Your Public Key
1. Go to **Account** → **General** in the dashboard
2. Find your **Public Key** (looks like a long alphanumeric string)
3. Copy it

### Step 5: Update Configuration
1. Open `src/lib/emailjs-config.ts`
2. Replace the placeholder values:

```typescript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'LS1lN8SYs5V6vdWUg',     // Paste your Public Key
  SERVICE_ID: 'service_rnku77s',          // Paste your Service ID
  TEMPLATE_ID: 'template_komoohv',        // Paste your Template ID
};
```

### Step 6: Test It
1. Restart your development server
2. Try any action that sends an email (like password reset or leave request)
3. Check your inbox at yogesh.albiorix@gmail.com

## Important Notes

### Free Tier Limits
- **200 emails/month** on free plan
- Upgrade to paid plan for more emails

### Gmail Setup
- Make sure to allow "Less secure app access" if using Gmail
- Or use App-specific password for better security
- EmailJS OAuth connection is recommended (easier and more secure)

### Testing
Test your email service with this simple test:

```typescript
import emailjs from '@emailjs/browser';

// Initialize with your public key
emailjs.init('LS1lN8SYs5V6vdWUg');

// Send test email
emailjs.send(
  'service_rnku77s',      // Your Service ID
  'template_komoohv',     // Your Template ID
  {
    to_email: 'yogesh.albiorix@gmail.com',
    to_name: 'Yogesh',
    subject: 'Test Email',
    message_html: '<h1>This is a test email</h1>',
    from_name: 'HRMS System'
  }
).then(
  (response) => console.log('SUCCESS!', response.status, response.text),
  (error) => console.log('FAILED...', error)
);
```

Or test using the API:
```bash
# Visit in browser:
http://localhost:4321/api/test-email

# Or using curl:
curl http://localhost:4321/api/test-email
```

## Troubleshooting

### Email not received?
1. **Check spam folder** - EmailJS emails sometimes go to spam initially
2. **Verify configuration** - Make sure all IDs are correct in `emailjs-config.ts`
3. **Check EmailJS dashboard** - View email history to see if it was sent
4. **Console errors** - Check browser console for any error messages
5. **Email service status** - Ensure your Gmail service is connected in EmailJS

### Common Issues
- **"PUBLIC_KEY not configured"**: Update the config file with real values
- **Service not found**: Double-check your Service ID
- **Template not found**: Double-check your Template ID
- **Authentication error**: Reconnect your Gmail account in EmailJS

### Email Variables
The following variables are available in your email templates:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{subject}}` - Email subject
- `{{message_html}}` - HTML email content
- `{{from_name}}` - Sender name (HRMS System)
- `{{activity_type}}` - Type of activity (leave_request, etc.)

## Alternative: Using Cloudflare Email Workers
If you prefer to use Cloudflare (since you're using Cloudflare D1):

1. Set up Cloudflare Email Workers
2. Create an API endpoint in your Astro app
3. Use `fetch()` to send emails via Cloudflare
4. Update `sendEmailNotification` function accordingly

## Support
- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: https://www.emailjs.com/support/
