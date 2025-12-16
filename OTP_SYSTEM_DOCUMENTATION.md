# OTP Email System Documentation

## Overview
A complete OTP (One-Time Password) email verification system integrated with EmailJS for secure user authentication.

## Features
✅ Generate 6-digit random OTP  
✅ Send OTP via email with beautiful templates  
✅ Verify OTP with expiration time  
✅ Resend OTP functionality  
✅ Multiple purposes (login, registration, password reset, email verification)  
✅ Auto-expiry after 10 minutes  
✅ In-memory storage (upgrade to database for production)  
✅ RESTful API endpoints  
✅ React component with auto-focus and paste support  

## File Structure

```
src/
├── lib/
│   ├── email-service.ts          # Core OTP & email functions
│   └── emailjs-config.ts         # EmailJS configuration
├── pages/
│   ├── api/
│   │   ├── send-otp.ts           # Send OTP endpoint
│   │   ├── verify-otp.ts         # Verify OTP endpoint
│   │   └── resend-otp.ts         # Resend OTP endpoint
│   └── otp-test.astro            # Demo/test page
└── components/
    └── Auth/
        ├── OTPInput.tsx          # OTP input component
        └── OTPDemo.tsx           # Demo implementation
```

## API Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/send-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "purpose": "login",  // optional: login|registration|password_reset|email_verification
  "expiryMinutes": 10  // optional, default: 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to user@example.com",
  "otp": "123456"  // Only in testing mode when EmailJS not configured
}
```

### 2. Verify OTP
**Endpoint:** `POST /api/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "OTP verified successfully!"
}
```

**Error Response:**
```json
{
  "valid": false,
  "message": "Invalid OTP. Please check and try again."
}
```

### 3. Resend OTP
**Endpoint:** `POST /api/resend-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "purpose": "login"
}
```

## Core Functions

### 1. Generate OTP
```typescript
import { generateOTP } from '../lib/email-service';

const otp = generateOTP();
// Returns: "123456" (6-digit random number)
```

### 2. Send OTP Email
```typescript
import { sendOTPEmail } from '../lib/email-service';

const result = await sendOTPEmail(
  'user@example.com',
  'User Name',
  'login',  // purpose
  10        // expiry minutes
);

console.log(result);
// { success: true, message: "OTP sent successfully..." }
```

### 3. Verify OTP
```typescript
import { verifyOTP } from '../lib/email-service';

const result = verifyOTP('user@example.com', '123456');

if (result.valid) {
  console.log('OTP verified!');
} else {
  console.log(result.message); // Error message
}
```

### 4. Check if Valid OTP Exists
```typescript
import { hasValidOTP } from '../lib/email-service';

if (hasValidOTP('user@example.com')) {
  console.log('User has a valid pending OTP');
}
```

### 5. Clear OTP
```typescript
import { clearOTP } from '../lib/email-service';

clearOTP('user@example.com');
```

### 6. Resend OTP
```typescript
import { resendOTP } from '../lib/email-service';

const result = await resendOTP(
  'user@example.com',
  'User Name',
  'login'
);
```

## React Component Usage

### Basic Usage
```tsx
import OTPInput from './components/Auth/OTPInput';

function MyComponent() {
  const [showOTP, setShowOTP] = useState(false);

  const handleVerified = () => {
    console.log('User verified!');
    // Proceed with login/registration
  };

  return (
    <>
      {showOTP ? (
        <OTPInput
          email="user@example.com"
          userName="User Name"
          purpose="login"
          onVerified={handleVerified}
          onCancel={() => setShowOTP(false)}
        />
      ) : (
        <button onClick={() => setShowOTP(true)}>
          Send OTP
        </button>
      )}
    </>
  );
}
```

## OTP Email Template

The OTP email includes:
- Beautiful gradient header with emoji
- Large, easy-to-read OTP code
- Expiry time information
- Security warnings
- Branded footer

### Email Features:
- 📱 Mobile-responsive design
- 🎨 Professional gradient styling
- ⏱️ Clear expiry information
- 🔒 Security tips and warnings
- 📋 Copy-paste friendly OTP display

## Integration Examples

### 1. Login with OTP
```tsx
import { useState } from 'react';
import { sendOTPEmail, verifyOTP } from '../lib/email-service';

function LoginWithOTP() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    const result = await sendOTPEmail(email, 'User', 'login');
    if (result.success) {
      setOtpSent(true);
    }
  };

  const handleVerifyOTP = async () => {
    const result = verifyOTP(email, otp);
    if (result.valid) {
      // Login successful
      window.location.href = '/dashboard';
    }
  };

  return (
    <div>
      {!otpSent ? (
        <>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <button onClick={handleSendOTP}>Send OTP</button>
        </>
      ) : (
        <>
          <input 
            type="text" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
          />
          <button onClick={handleVerifyOTP}>Verify OTP</button>
        </>
      )}
    </div>
  );
}
```

### 2. Email Verification During Registration
```tsx
import { sendOTPEmail, verifyOTP } from '../lib/email-service';

async function handleRegistration(userData) {
  // Step 1: Create user account
  const user = await createUser(userData);
  
  // Step 2: Send verification OTP
  await sendOTPEmail(
    userData.email, 
    userData.name, 
    'registration'
  );
  
  // Step 3: Show OTP input
  showOTPVerification();
}

async function verifyEmail(email, otp) {
  const result = verifyOTP(email, otp);
  
  if (result.valid) {
    // Mark email as verified in database
    await markEmailVerified(email);
    return true;
  }
  return false;
}
```

### 3. Password Reset with OTP
```tsx
import { sendOTPEmail, verifyOTP } from '../lib/email-service';

async function requestPasswordReset(email) {
  // Check if user exists
  const user = await getUserByEmail(email);
  
  if (user) {
    // Send OTP
    await sendOTPEmail(
      email, 
      user.name, 
      'password_reset'
    );
  }
  
  // Always show success message (security)
  return { success: true };
}

async function resetPassword(email, otp, newPassword) {
  // Verify OTP
  const result = verifyOTP(email, otp);
  
  if (!result.valid) {
    return { success: false, message: result.message };
  }
  
  // Update password
  await updateUserPassword(email, newPassword);
  
  return { success: true };
}
```

## Testing

### Local Testing (Without EmailJS)
When EmailJS is not configured, the OTP is displayed in:
1. Browser console
2. Toast message (in demo)
3. API response (for testing)

### Test Page
Visit: `http://localhost:4321/otp-test`

This page provides a complete testing interface with:
- Email input
- Name input
- Purpose selection
- OTP input with auto-focus
- Resend functionality
- Timer countdown

## Security Best Practices

### Current Implementation
✅ 6-digit random OTP  
✅ 10-minute expiration  
✅ One-time use (marked as verified after use)  
✅ Auto-deletion after verification  
✅ No OTP in URL or logs (production)  

### Recommended Upgrades for Production

1. **Database Storage**
```typescript
// Replace in-memory Map with database
// Example with Cloudflare D1:

export async function storeOTPInDB(
  email: string, 
  otp: string, 
  purpose: string,
  expiresAt: Date
) {
  await db.prepare(`
    INSERT INTO otps (email, otp, purpose, expires_at, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(email, otp, purpose, expiresAt.toISOString()).run();
}

export async function verifyOTPFromDB(email: string, otp: string) {
  const result = await db.prepare(`
    SELECT * FROM otps 
    WHERE email = ? AND otp = ? 
    AND verified = 0 
    AND datetime('now') < expires_at
  `).bind(email, otp).first();
  
  if (result) {
    // Mark as verified
    await db.prepare(`
      UPDATE otps SET verified = 1 
      WHERE id = ?
    `).bind(result.id).run();
    
    return { valid: true, message: 'OTP verified!' };
  }
  
  return { valid: false, message: 'Invalid or expired OTP' };
}
```

2. **Rate Limiting**
```typescript
// Limit OTP requests per email
const otpRequestCounts = new Map<string, { count: number; resetAt: Date }>();

export function checkRateLimit(email: string): boolean {
  const now = new Date();
  const record = otpRequestCounts.get(email);
  
  if (!record || now > record.resetAt) {
    // Reset counter
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    otpRequestCounts.set(email, { count: 1, resetAt });
    return true;
  }
  
  if (record.count >= 5) {
    return false; // Max 5 OTPs per hour
  }
  
  record.count++;
  return true;
}
```

3. **IP-based Rate Limiting**
4. **Failed Attempt Tracking**
5. **Account Lockout after Multiple Failed Attempts**
6. **SMS Backup (Twilio, etc.)**
7. **2FA Integration**

## Environment Variables

Add these to your `.env` file:
```env
# EmailJS Configuration
PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
PUBLIC_EMAILJS_SERVICE_ID=your_service_id
PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=5
```

## Troubleshooting

### OTP Not Received?
1. ✅ Check EmailJS configuration in `src/lib/emailjs-config.ts`
2. ✅ Verify email service is connected in EmailJS dashboard
3. ✅ Check spam/junk folder
4. ✅ Look for OTP in browser console (testing mode)
5. ✅ Check EmailJS dashboard for sent emails

### OTP Invalid?
1. Check expiration time (default 10 minutes)
2. Ensure OTP hasn't been used already
3. Verify email address matches exactly
4. Check for typos in OTP entry

### Development Mode
When EmailJS is not configured:
- OTP is logged to console
- OTP is returned in API response
- Toast message shows OTP for testing

## Production Checklist

Before deploying to production:

- [ ] Configure EmailJS properly
- [ ] Remove OTP from API responses
- [ ] Move OTP storage to database
- [ ] Implement rate limiting
- [ ] Add failed attempt tracking
- [ ] Set up monitoring and alerts
- [ ] Test email deliverability
- [ ] Configure SPF/DKIM records
- [ ] Add backup SMS provider
- [ ] Implement account lockout
- [ ] Add audit logging
- [ ] Test with real email addresses

## Support

For issues or questions:
1. Check EMAILJS_SETUP_GUIDE.md for EmailJS configuration
2. Review console logs for detailed error messages
3. Test with the demo page at `/otp-test`
4. Verify EmailJS dashboard for email history

## Future Enhancements

- [ ] SMS OTP fallback
- [ ] WhatsApp OTP integration
- [ ] QR code verification
- [ ] Biometric authentication
- [ ] Push notification OTP
- [ ] Voice call OTP
- [ ] Multi-language support
- [ ] Custom OTP length options
- [ ] Configurable expiry times per purpose
