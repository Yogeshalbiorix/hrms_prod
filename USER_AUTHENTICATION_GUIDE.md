# End-User Authentication System - Complete Guide

## Overview
This document describes the complete end-user authentication system implemented in the HRMS application. The system supports user registration, login, logout, password reset, profile management, and role-based access control.

## Features Implemented

### 1. User Registration
- **UI Component**: `src/components/Auth/RegisterPage.tsx`
- **API Endpoint**: `POST /api/auth/register`
- **Features**:
  - Full name, username, email, phone, and position fields
  - Password strength validation (min 8 characters, letters + numbers)
  - Email format validation
  - Username uniqueness check
  - Automatic employee record creation
  - Duplicate email prevention
  - User role assignment (default: employee)
  - Audit logging for registration events

### 2. User Login
- **UI Component**: `src/components/Auth/LoginPage.tsx` (Updated with Ant Design)
- **API Endpoint**: `POST /api/auth/login` (Existing)
- **Features**:
  - Username and password authentication
  - Session token generation (24-hour expiration)
  - "Forgot Password?" link
  - "Create Account" link
  - Responsive design with gradient background
  - Demo credentials display

### 3. Forgot Password
- **UI Component**: `src/components/Auth/ForgotPasswordPage.tsx`
- **API Endpoint**: `POST /api/auth/forgot-password`
- **Features**:
  - Email-based password reset request
  - Secure token generation (32-byte hex)
  - Token expiration (1 hour)
  - Protection against email enumeration
  - Account lock check
  - Audit logging
  - Development mode: Token displayed in response (remove in production)

### 4. Reset Password
- **UI Component**: `src/components/Auth/ResetPasswordPage.tsx`
- **API Endpoint**: `POST /api/auth/reset-password`
- **Features**:
  - Token validation
  - Password strength validation
  - Password confirmation matching
  - All sessions invalidation for security
  - Token marked as used after reset
  - Audit logging
  - Success/error result pages

### 5. User Profile Management
- **UI Component**: `src/components/Auth/UserProfile.tsx`
- **API Endpoints**:
  - `PUT /api/auth/profile` - Update profile
  - `POST /api/auth/change-password` - Change password
  - `GET /api/auth/audit-logs` - View activity log
- **Features**:
  - Profile photo upload (placeholder)
  - Personal information editing (name, email, phone)
  - Password change with current password verification
  - Activity log viewer with action tags
  - Three-tab interface (Profile, Password, Activity)

### 6. User Audit Logging
- **Database Table**: `user_audit_log`
- **Tracked Actions**:
  - USER_REGISTERED
  - LOGIN
  - LOGOUT
  - PASSWORD_CHANGED
  - PASSWORD_RESET_REQUESTED
  - PASSWORD_RESET_COMPLETED
  - PROFILE_UPDATED
- **Logged Information**:
  - User ID
  - Action type
  - Description
  - IP address
  - User agent
  - Timestamp

## Database Schema

### New Tables Created

#### password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### user_permissions
```sql
CREATE TABLE user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_name TEXT NOT NULL,
    granted_by INTEGER,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, permission_name)
);
```

#### user_audit_log
```sql
CREATE TABLE user_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body**:
```json
{
  "username": "johndoe",
  "password": "SecurePass123",
  "email": "john@example.com",
  "full_name": "John Doe",
  "phone": "+1 (555) 123-4567",
  "position": "Software Engineer",
  "department_id": 1
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 5,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "employee",
    "employee_id": 5
  }
}
```

#### POST /api/auth/forgot-password
Request a password reset.

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent",
  "dev_only": {
    "token": "abc123...",
    "resetLink": "https://yogeshs-ultra-awesome-site-d54a59.webflow.io/reset-password?token=abc123...",
    "expiresAt": "2025-01-15T10:30:00Z"
  }
}
```

#### POST /api/auth/reset-password
Reset password using token.

**Request Body**:
```json
{
  "token": "abc123...",
  "newPassword": "NewSecurePass456"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

#### PUT /api/auth/profile
Update user profile (authenticated).

**Request Body**:
```json
{
  "full_name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1 (555) 987-6543"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### POST /api/auth/change-password
Change user password (authenticated).

**Request Body**:
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### GET /api/auth/audit-logs
Get user's activity log (authenticated).

**Query Parameters**:
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200)**:
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "action": "LOGIN",
      "description": "User logged in successfully",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-15T09:30:00Z"
    }
  ]
}
```

## Database Functions Added to `src/lib/db.ts`

### Password Reset Token Management
- `createPasswordResetToken(db, userId, token, expiresAt)`
- `getPasswordResetToken(db, token)`
- `markPasswordResetTokenAsUsed(db, token)`
- `deletePasswordResetToken(db, token)`

### User Management
- `getUserByEmail(db, email)`
- `createUser(db, userData)`
- `updateUserPassword(db, userId, passwordHash)`
- `updateUserProfile(db, userId, updates)`
- `incrementFailedLoginAttempts(db, userId)`
- `resetFailedLoginAttempts(db, userId)`
- `lockUserAccount(db, userId, lockUntil)`

### User Permissions
- `getUserPermissions(db, userId)`
- `grantPermission(db, userId, permissionName, grantedBy)`
- `revokePermission(db, userId, permissionName)`

### Audit Logging
- `createAuditLog(db, logEntry)`
- `getUserAuditLogs(db, userId, limit, offset)`

## UI Components

### RegisterPage
- **Path**: `src/components/Auth/RegisterPage.tsx`
- **Props**:
  - `onSuccess?: () => void` - Callback after successful registration
  - `onLoginClick?: () => void` - Callback for "Sign In" link
- **Features**:
  - Form validation with Ant Design
  - Two-column responsive layout
  - Password strength indicators
  - Confirm password matching

### ForgotPasswordPage
- **Path**: `src/components/Auth/ForgotPasswordPage.tsx`
- **Props**:
  - `onBackToLogin?: () => void` - Callback for "Back to Login" button
- **Features**:
  - Email input with validation
  - Success result page
  - Development token display (remove in production)

### ResetPasswordPage
- **Path**: `src/components/Auth/ResetPasswordPage.tsx`
- **Props**:
  - `token?: string` - Reset token (from URL or props)
  - `onSuccess?: () => void` - Callback after successful reset
  - `onBackToLogin?: () => void` - Callback for "Back to Login" button
- **Features**:
  - Token validation
  - Password strength indicators
  - Success/error result pages
  - Auto-redirect to login after success

### UserProfile
- **Path**: `src/components/Auth/UserProfile.tsx`
- **Features**:
  - Three tabs: Profile, Password, Activity
  - Avatar display with upload button (placeholder)
  - Profile information form
  - Password change form
  - Activity log table with filters

### Updated LoginPage
- **Path**: `src/components/Auth/LoginPage.tsx`
- **New Features**:
  - Ant Design components
  - View mode switching (login, register, forgot-password, reset-password)
  - "Forgot password?" link
  - "Create Account" button
  - Gradient background
  - Demo credentials display

## Security Features

### Password Security
- Minimum 8 characters
- Must contain letters and numbers
- Hashed with bcrypt (10 rounds)
- Password history tracking (last_password_change)

### Session Security
- 24-hour session expiration
- Session invalidation on password change
- Session token stored in HTTP-only cookies
- IP address and user agent tracking

### Account Protection
- Failed login attempt tracking
- Account lockout after multiple failures
- Password reset token expiration (1 hour)
- Single-use reset tokens

### Audit Trail
- All authentication events logged
- IP address and user agent captured
- Timestamp for all actions
- Queryable audit log for compliance

## Usage Flow

### New User Registration
1. User clicks "Create Account" on login page
2. Fills out registration form (name, username, email, password, etc.)
3. System validates input and checks for duplicates
4. Creates employee record and user account
5. Logs registration event
6. Redirects to login page

### Forgot Password
1. User clicks "Forgot password?" on login page
2. Enters email address
3. System generates secure token and creates reset record
4. (Production: Send email with reset link)
5. Development: Display token in response
6. User clicks reset link or enters token
7. Enters new password
8. System validates token and updates password
9. All sessions invalidated
10. User redirected to login

### Profile Management
1. Authenticated user navigates to profile page
2. Can update personal information (name, email, phone)
3. Can change password (requires current password)
4. Can view activity log
5. All changes are audited

## Testing

### Test User Registration
```bash
curl -X POST https://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123",
    "email": "test@example.com",
    "full_name": "Test User",
    "position": "Tester"
  }'
```

### Test Forgot Password
```bash
curl -X POST https://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Test Reset Password
```bash
curl -X POST https://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "newPassword": "NewPass456"
  }'
```

## Production Checklist

- [ ] Remove `dev_only` field from forgot-password response
- [ ] Integrate email service (SendGrid, AWS SES, etc.)
- [ ] Configure email templates for password reset
- [ ] Set up HTTPS/SSL for production
- [ ] Configure secure session cookies (secure, httpOnly, sameSite)
- [ ] Implement rate limiting on authentication endpoints
- [ ] Set up monitoring for failed login attempts
- [ ] Configure backup and recovery for audit logs
- [ ] Implement CAPTCHA for registration and login
- [ ] Set up email verification for new accounts
- [ ] Configure two-factor authentication (optional)
- [ ] Implement password complexity requirements
- [ ] Set up automated session cleanup
- [ ] Configure log retention policy
- [ ] Implement brute force protection
- [ ] Set up account recovery mechanisms

## Future Enhancements

### Planned Features
1. **Email Verification**: Send verification email on registration
2. **Two-Factor Authentication (2FA)**: SMS or authenticator app
3. **Social Login**: Google, Microsoft, GitHub OAuth
4. **Remember Me**: Extended session option
5. **Password History**: Prevent reusing recent passwords
6. **Account Recovery**: Security questions or backup codes
7. **Admin User Management**: Manage users from admin panel
8. **Role-Based Permissions**: Granular access control
9. **Session Management**: View and revoke active sessions
10. **Export Audit Logs**: Download activity history

## Troubleshooting

### Common Issues

**Issue**: User registration fails with "duplicate column" error
- **Solution**: Database schema already has those columns, this is expected

**Issue**: Password reset token shows as expired immediately
- **Solution**: Check system time synchronization

**Issue**: Session not persisting
- **Solution**: Check cookie settings and CORS configuration

**Issue**: Audit logs not appearing
- **Solution**: Verify `user_audit_log` table exists and API endpoint is accessible

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         React Components (Ant Design)       │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Login  │ │Register│ │Profile │          │
│  └────────┘ └────────┘ └────────┘          │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│          API Routes (Astro)                 │
│  /api/auth/login                            │
│  /api/auth/register                         │
│  /api/auth/forgot-password                  │
│  /api/auth/reset-password                   │
│  /api/auth/profile                          │
│  /api/auth/change-password                  │
│  /api/auth/audit-logs                       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│       Database Functions (db.ts)            │
│  - User CRUD                                │
│  - Session Management                       │
│  - Password Reset Tokens                    │
│  - Permissions                              │
│  - Audit Logging                            │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│     Cloudflare D1 Database (SQLite)         │
│  - users                                    │
│  - sessions                                 │
│  - password_reset_tokens                    │
│  - user_permissions                         │
│  - user_audit_log                           │
│  - employees                                │
└─────────────────────────────────────────────┘
```

## Support

For questions or issues, please refer to:
- Project documentation in `README.md`
- Database setup in `DATABASE_SETUP.md`
- Ant Design setup in `ANT_DESIGN_SETUP.md`

---

**Last Updated**: January 15, 2025
**Version**: 1.0.0
