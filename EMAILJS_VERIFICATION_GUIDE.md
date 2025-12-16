# EmailJS Template Setup Verification

## Your Current Configuration ✅

```typescript
PUBLIC_KEY: 'LS1lN8SYs5V6vdWUg'
SERVICE_ID: 'service_rnku77s'
TEMPLATE_ID: 'template_komoohv'
```

## Template Variables Required

Your EmailJS template `template_komoohv` needs these variables:

### Required Variables:
- `{{to_email}}` - Recipient email address
- `{{to_name}}` - Recipient name
- `{{subject}}` - Email subject
- `{{message_html}}` - HTML email content
- `{{from_name}}` - Sender name (HRMS System)

### Optional Variables (for OTP emails):
- `{{otp_code}}` - The OTP code
- `{{expiry_minutes}}` - Expiration time in minutes

## How to Set Up Your Template

### Option 1: Full HTML Template (Recommended)
Use this in your EmailJS template Content section:

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

### Option 2: Simple Template
If you prefer a simpler setup:

**Subject:** `{{subject}}`

**Content:**
```
Dear {{to_name}},

{{{message_html}}}

Best regards,
{{from_name}}
```

⚠️ **Important:** Use triple braces `{{{message_html}}}` to render HTML content!

## Template Settings in EmailJS Dashboard

1. **Template Name:** HRMS Notifications
2. **Subject:** `{{subject}}`
3. **Content:** Use one of the templates above
4. **From Name:** Your HRMS System or your company name
5. **Reply To:** Your support email

## Test Your Configuration

### Method 1: Use the Test API Endpoint
```bash
# Visit this URL in your browser:
http://localhost:4321/api/test-email
```

This will send a test OTP email to `yogesh.albiorix@gmail.com`

### Method 2: Use the OTP Test Page
```bash
# Visit this URL:
http://localhost:4321/otp-test
```

Fill in:
- Email: yogesh.albiorix@gmail.com
- Name: Yogesh Purnawasi
- Click "Send OTP"

### Method 3: Test from Browser Console
Open browser console and run:
```javascript
fetch('/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'yogesh.albiorix@gmail.com',
    name: 'Yogesh Purnawasi',
    purpose: 'login',
    expiryMinutes: 10
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Troubleshooting

### Email Not Received?

1. **Check EmailJS Dashboard**
   - Go to https://dashboard.emailjs.com/
   - Click on "History" tab
   - See if the email was sent successfully

2. **Check Spam Folder**
   - Sometimes EmailJS emails go to spam initially
   - Mark as "Not Spam" to whitelist

3. **Verify Service Connection**
   - Go to Email Services in EmailJS dashboard
   - Make sure `service_rnku77s` is active and connected
   - Try reconnecting your Gmail account

4. **Check Template Variables**
   - Go to Email Templates > `template_komoohv`
   - Click "Test it" button
   - Fill in sample variables
   - Send test email

5. **Browser Console**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Look for EmailJS success/error messages

### Common Issues

**Issue:** "Invalid template ID"
- **Solution:** Double-check `TEMPLATE_ID` matches exactly in EmailJS dashboard

**Issue:** "Service not found"
- **Solution:** Verify `SERVICE_ID` is correct and service is active

**Issue:** "Unauthorized"
- **Solution:** Check `PUBLIC_KEY` is correct in EmailJS dashboard

**Issue:** Email sends but looks wrong
- **Solution:** Use triple braces `{{{message_html}}}` in template for HTML rendering

## EmailJS Dashboard Checklist

- [ ] Account verified
- [ ] Gmail service connected (service_rnku77s)
- [ ] Template created (template_komoohv)
- [ ] Template has correct variables
- [ ] Template uses `{{{message_html}}}` with triple braces
- [ ] Public key is correct (LS1lN8SYs5V6vdWUg)
- [ ] Tested template from EmailJS dashboard
- [ ] Domain is added (if using in production)

## Email Template Preview

When you send an OTP, the email will look like:

**Subject:** 🔐 Your Login OTP - HRMS

**Content:**
- Professional gradient header with emoji 🔐
- Large, readable OTP code in gradient box
- Expiration time (10 minutes)
- Security warnings
- Branded HRMS footer

Example:
```
╔════════════════════════════════╗
║     🔐 Verification Code        ║
╚════════════════════════════════╝

Hello Yogesh Purnawasi,

You have requested to login to your HRMS account.
Here is your One-Time Password (OTP):

┌────────────────────────────────┐
│      Your OTP Code             │
│         123456                 │
│   Valid for 10 minutes         │
└────────────────────────────────┘

⚠️ Important:
• This OTP will expire in 10 minutes
• Do not share this code with anyone
• Use this code only on the official HRMS platform
```

## Next Steps

1. ✅ Configuration is complete
2. 🧪 Test using: `http://localhost:4321/api/test-email`
3. 📧 Check `yogesh.albiorix@gmail.com` inbox
4. ✅ If received, your setup is working!
5. 🚀 Start using OTP in your app

## Production Notes

When deploying to production:
- Add your production domain to EmailJS dashboard
- Consider upgrading EmailJS plan for higher limits (200/month on free tier)
- Monitor EmailJS usage in dashboard
- Set up SPF/DKIM for better deliverability

## Support

If you still have issues:
1. Check EmailJS History tab for delivery status
2. Review browser console for detailed errors
3. Test template directly in EmailJS dashboard
4. Contact EmailJS support if needed
