# EmailJS Quick Reference Card

## 🔑 Your Credentials

```
PUBLIC_KEY:  LS1lN8SYs5V6vdWUg
SERVICE_ID:  service_rnku77s
TEMPLATE_ID: template_komoohv
```

## 🚀 Quick Test Commands

### Test Email API (Instant)
```bash
http://localhost:4321/api/test-email
```

### OTP Test Page (Interactive)
```bash
http://localhost:4321/otp-test
```

### Browser Console Test
```javascript
fetch('/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'yogesh.albiorix@gmail.com',
    name: 'Yogesh Purnawasi',
    purpose: 'login'
  })
}).then(r => r.json()).then(console.log);
```

## 📧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/send-otp` | POST | Send OTP to email |
| `/api/verify-otp` | POST | Verify OTP code |
| `/api/resend-otp` | POST | Resend new OTP |
| `/api/test-email` | GET | Send test email |

## 💻 Code Examples

### Send OTP
```typescript
import { sendOTPEmail } from './lib/email-service';

await sendOTPEmail(
  'yogesh.albiorix@gmail.com',
  'Yogesh',
  'login',
  10
);
```

### Verify OTP
```typescript
import { verifyOTP } from './lib/email-service';

const result = verifyOTP('yogesh.albiorix@gmail.com', '123456');
```

### Use OTP Component
```tsx
<OTPInput
  email="yogesh.albiorix@gmail.com"
  userName="Yogesh"
  purpose="login"
  onVerified={() => console.log('Verified!')}
/>
```

## 🔍 Template Setup

Your template `template_komoohv` needs:

**Subject:** `{{subject}}`

**Content:**
```html
<p>Dear {{to_name}},</p>
<div>{{{message_html}}}</div>
<p>Best regards,<br>{{from_name}}</p>
```

⚠️ Use triple braces `{{{message_html}}}`

## 📊 Dashboard Links

- [Dashboard](https://dashboard.emailjs.com/)
- [Services](https://dashboard.emailjs.com/admin)
- [Templates](https://dashboard.emailjs.com/admin/templates)
- [History](https://dashboard.emailjs.com/admin/history)
- [Settings](https://dashboard.emailjs.com/admin/account)

## 🛠️ Files Location

```
src/
├── lib/
│   ├── emailjs-config.ts      ← Your credentials
│   └── email-service.ts        ← Email functions
├── pages/api/
│   ├── send-otp.ts
│   ├── verify-otp.ts
│   ├── resend-otp.ts
│   └── test-email.ts
└── components/Auth/
    ├── OTPInput.tsx
    └── OTPDemo.tsx
```

## ⚠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| Email not received | Check spam folder |
| Template error | Verify template_komoohv exists |
| Service error | Check service_rnku77s is connected |
| Auth error | Verify LS1lN8SYs5V6vdWUg is correct |

## 📈 Limits

- **Free**: 200 emails/month
- **Personal**: 1,000 emails/month ($7)
- **Pro**: 5,000 emails/month ($15)

## ✅ Status

**Configuration:** ✅ Complete  
**API Endpoints:** ✅ Working  
**Components:** ✅ Ready  
**Email Service:** ✅ Active  

**Test Email:** yogesh.albiorix@gmail.com

## 📚 Documentation

- [EMAILJS_STATUS.md](EMAILJS_STATUS.md) - Complete status
- [EMAILJS_SETUP_GUIDE.md](EMAILJS_SETUP_GUIDE.md) - Setup guide
- [EMAILJS_VERIFICATION_GUIDE.md](EMAILJS_VERIFICATION_GUIDE.md) - Verification
- [OTP_SYSTEM_DOCUMENTATION.md](OTP_SYSTEM_DOCUMENTATION.md) - OTP docs

---

**Last Updated:** December 16, 2025  
**Status:** ✅ Fully Configured & Operational
