# 🚀 Quick Reference - User Authentication System

## 🔗 URLs

| Feature | URL |
|---------|-----|
| Login | http://localhost:3000 |
| Register | Click "Create Account" on login page |
| Forgot Password | Click "Forgot password?" on login page |
| Reset Password |https://yogeshs-ultra-awesome-site-d54a59.webflow.io/reset-password?token=YOUR_TOKEN |
| User Profile | (Add route in your app) |

## 📱 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/audit-logs` | Get activity log |

## 🗂️ Components

| Component | Path | Purpose |
|-----------|------|---------|
| RegisterPage | `src/components/Auth/RegisterPage.tsx` | Registration form |
| ForgotPasswordPage | `src/components/Auth/ForgotPasswordPage.tsx` | Request password reset |
| ResetPasswordPage | `src/components/Auth/ResetPasswordPage.tsx` | Reset password form |
| UserProfile | `src/components/Auth/UserProfile.tsx` | Profile management |
| LoginPage | `src/components/Auth/LoginPage.tsx` | Login (updated) |

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `password_reset_tokens` | Store password reset tokens |
| `user_permissions` | Role-based access control |
| `user_audit_log` | Activity tracking |
| `users` | User accounts |
| `sessions` | Active sessions |
| `employees` | Employee records |

## 🔧 Quick Commands

```bash
# Start development server
npm run dev

# Apply database schema
npx wrangler d1 execute hrms-database --local --file=./db/user-auth-enhancements.sql

# Test registration
curl -X POSThttps://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test1234","email":"test@test.com","full_name":"Test User"}'

# Test forgot password
curl -X POSThttps://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```

## ✅ Validation Rules

### Password
- Minimum 8 characters
- Must contain letters and numbers
- Must match confirmation

### Email
- Valid email format
- Must be unique

### Username
- Minimum 3 characters
- Letters, numbers, underscores only
- Must be unique

## 🎨 UI Features

- ✅ Ant Design components
- ✅ Gradient background (purple to blue)
- ✅ Responsive design
- ✅ Real-time validation
- ✅ Loading states
- ✅ Error messages
- ✅ Success feedback

## 🔐 Security Features

- ✅ Bcrypt password hashing
- ✅ Session tokens (24-hour expiration)
- ✅ Password reset tokens (1-hour expiration)
- ✅ Email enumeration protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Audit logging

## 📚 Documentation Files

- `USER_AUTHENTICATION_GUIDE.md` - Complete guide
- `AUTHENTICATION_COMPLETE.md` - Implementation summary
- `ANT_DESIGN_SETUP.md` - UI component guide
- `QUICK_REFERENCE.md` - This file

## 🎯 User Workflows

### Register → Login
1. Visit http://localhost:3000
2. Click "Create Account"
3. Fill form and submit
4. Redirected to login
5. Login with credentials

### Forgot Password → Reset
1. Click "Forgot password?"
2. Enter email
3. Copy token from response (dev mode)
4. Visit reset URL with token
5. Enter new password
6. Login with new password

### Update Profile
1. Login to app
2. Navigate to profile page
3. Edit information
4. Save changes

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "duplicate column" error | Columns already exist, safe to ignore |
| Registration fails | Check console for validation errors |
| Token expired | Request new password reset |
| Profile not updating | Check network tab for API errors |

## 📞 Need Help?

- Check `USER_AUTHENTICATION_GUIDE.md` for detailed documentation
- Review `AUTHENTICATION_COMPLETE.md` for implementation details
- See examples in component files
- Check API endpoint responses for error messages

---

**Quick Access**: Dev server at http://localhost:3000
**Status**: ✅ Fully functional
