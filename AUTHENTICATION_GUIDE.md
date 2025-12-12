# Authentication System - HRMS

## Overview
A complete login/logout authentication system has been implemented for the HRMS application using session-based authentication with Cloudflare D1.

## Features
✅ User authentication with username/password
✅ Session management with expiration (24 hours)
✅ Secure logout functionality
✅ Session validation and verification
✅ Role-based access (admin, hr, manager, employee)
✅ User profile display in sidebar
✅ Protected dashboard access

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `password_hash`: Hashed password
- `full_name`: Full name of user
- `role`: User role (admin, hr, manager, employee)
- `employee_id`: Link to employees table
- `is_active`: Account status
- `last_login`: Last login timestamp

### Sessions Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `session_token`: Unique session token
- `expires_at`: Session expiration timestamp
- `ip_address`: User's IP address
- `user_agent`: Browser user agent

## Default Credentials

**Username:** `admin`  
**Password:** `admin123`  
**Role:** admin

⚠️ **Important:** Change the default password in production!

## API Endpoints

### POST /api/auth/login
Login with username and password
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@hrms.com",
    "full_name": "System Administrator",
    "role": "admin"
  },
  "sessionToken": "...",
  "expiresAt": "2025-12-13T19:30:00.000Z"
}
```

### POST /api/auth/logout
Logout and invalidate session
```json
{
  "sessionToken": "..."
}
```

### GET /api/auth/verify
Verify session validity
Headers:
```
Authorization: Bearer <sessionToken>
```

## Components

### AuthContext (`src/components/Auth/AuthContext.tsx`)
React context provider for authentication state management
- Manages user session state
- Provides login/logout functions
- Handles session persistence in localStorage
- Automatic session validation on app load

### LoginPage (`src/components/Auth/LoginPage.tsx`)
Beautiful login form with:
- Username and password fields
- Error display
- Loading states
- Demo credentials info
- Responsive design

### App (`src/components/App.tsx`)
Main application wrapper that:
- Shows loading screen during initialization
- Displays LoginPage for unauthenticated users
- Shows HRMSDashboard for authenticated users

### Updated Sidebar
- Displays logged-in user information
- Logout button with confirmation
- Role display

## How It Works

1. **Initial Load**: App checks localStorage for existing session token
2. **Session Validation**: If token exists, validates with server
3. **Login Flow**:
   - User enters credentials
   - Server validates and creates session
   - Token stored in localStorage
   - User redirected to dashboard
4. **Authenticated State**: All dashboard features accessible
5. **Logout Flow**:
   - User clicks logout button
   - Session deleted from database
   - Token removed from localStorage
   - User redirected to login page

## Security Features

- Session-based authentication
- Session tokens are unique and time-limited (24 hours)
- Passwords stored as hashes (bcrypt compatible)
- Session validation on protected routes
- Automatic session cleanup
- User activity tracking (last login, IP, user agent)

## Future Enhancements

1. **Password Security**: Implement bcrypt for password hashing
2. **Remember Me**: Optional extended sessions
3. **Two-Factor Authentication**: Add 2FA support
4. **Password Reset**: Email-based password recovery
5. **Account Registration**: Self-service user registration
6. **Session Management**: View and revoke active sessions
7. **Login History**: Track login attempts and history
8. **Role-based Permissions**: Granular permission system

## Usage

1. Navigate to http://localhost:3000
2. You'll see the login page
3. Enter credentials (admin/admin123)
4. Access the full HRMS dashboard
5. Logout using the button in the sidebar

## Files Created/Modified

### New Files
- `db/auth-schema.sql` - Authentication database schema
- `src/components/Auth/AuthContext.tsx` - Auth context provider
- `src/components/Auth/LoginPage.tsx` - Login UI component
- `src/components/App.tsx` - Main app wrapper
- `src/pages/api/auth/login.ts` - Login API endpoint
- `src/pages/api/auth/logout.ts` - Logout API endpoint
- `src/pages/api/auth/verify.ts` - Session verification endpoint

### Modified Files
- `src/lib/db.ts` - Added auth database functions
- `src/components/Dashboard/Sidebar.tsx` - Added logout functionality
- `src/pages/index.astro` - Updated to use App component

## Testing

1. **Login Test**: Try logging in with admin/admin123
2. **Invalid Credentials**: Try wrong password - should show error
3. **Session Persistence**: Refresh page - should stay logged in
4. **Logout Test**: Click logout - should return to login page
5. **Protected Access**: Clear localStorage and try accessing dashboard

## Deployment Notes

Before deploying to production:
1. Change default admin password
2. Implement proper password hashing (bcrypt)
3. Set up secure session token generation
4. Configure session expiration times
5. Add rate limiting to login endpoint
6. Set up HTTPS/SSL
7. Run auth schema on production database:
   ```bash
   npx wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql
   ```
