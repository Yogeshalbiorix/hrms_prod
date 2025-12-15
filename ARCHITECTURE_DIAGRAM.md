# Authentication System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                            │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    React Components (UI Layer)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  LoginPage   │  │ RegisterPage │  │  UserProfile │             │
│  │  (Updated)   │  │    (New)     │  │    (New)     │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│  ┌──────┴───────────┐  ┌──┴──────────────┐ ┌┴────────────────┐   │
│  │ ForgotPassword   │  │  ResetPassword   │ │  AuthContext    │   │
│  │     (New)        │  │     (New)        │ │  (Existing)     │   │
│  └──────────────────┘  └──────────────────┘ └─────────────────┘   │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ HTTP Requests (fetch API)
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Astro API Routes (Backend)                       │
│                                                                      │
│  Authentication Endpoints:                                          │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ POST   /api/auth/register          (New)              │        │
│  │ POST   /api/auth/login             (Existing)         │        │
│  │ POST   /api/auth/logout            (Existing)         │        │
│  │ POST   /api/auth/forgot-password   (New)              │        │
│  │ POST   /api/auth/reset-password    (New)              │        │
│  │ PUT    /api/auth/profile           (New)              │        │
│  │ POST   /api/auth/change-password   (New)              │        │
│  │ GET    /api/auth/audit-logs        (New)              │        │
│  │ GET    /api/auth/verify            (Existing)         │        │
│  └────────────────────────────────────────────────────────┘        │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ Database Operations
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Database Functions (src/lib/db.ts)                 │
│                                                                      │
│  User Management:                                                   │
│  • getUserByUsername()       • createUser()                         │
│  • getUserByEmail()          • updateUserProfile()                  │
│  • getUserFromSession()      • updateUserPassword()                 │
│                                                                      │
│  Session Management:                                                │
│  • createSession()           • deleteSession()                      │
│  • getSessionByToken()       • deleteAllUserSessions()              │
│                                                                      │
│  Password Reset:                                                    │
│  • createPasswordResetToken()                                       │
│  • getPasswordResetToken()                                          │
│  • markPasswordResetTokenAsUsed()                                   │
│                                                                      │
│  Permissions:                                                       │
│  • getUserPermissions()      • grantPermission()                    │
│  • revokePermission()                                               │
│                                                                      │
│  Audit Logging:                                                     │
│  • createAuditLog()          • getUserAuditLogs()                   │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ SQL Queries
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Cloudflare D1 Database (SQLite)                        │
│                                                                      │
│  Existing Tables:              New Tables:                          │
│  ┌──────────────────┐         ┌──────────────────────────┐        │
│  │ users            │         │ password_reset_tokens    │        │
│  │ - id             │         │ - id                     │        │
│  │ - username       │         │ - user_id                │        │
│  │ - password_hash  │         │ - token                  │        │
│  │ - email          │         │ - expires_at             │        │
│  │ - full_name      │         │ - used                   │        │
│  │ - role           │         │ - created_at             │        │
│  │ - employee_id    │         └──────────────────────────┘        │
│  │ - is_active      │                                              │
│  │ - last_login     │         ┌──────────────────────────┐        │
│  └──────────────────┘         │ user_permissions         │        │
│                                │ - id                     │        │
│  ┌──────────────────┐         │ - user_id                │        │
│  │ sessions         │         │ - permission_name        │        │
│  │ - id             │         │ - granted_by             │        │
│  │ - user_id        │         │ - granted_at             │        │
│  │ - session_token  │         └──────────────────────────┘        │
│  │ - expires_at     │                                              │
│  │ - ip_address     │         ┌──────────────────────────┐        │
│  │ - user_agent     │         │ user_audit_log           │        │
│  └──────────────────┘         │ - id                     │        │
│                                │ - user_id                │        │
│  ┌──────────────────┐         │ - action                 │        │
│  │ employees        │         │ - description            │        │
│  │ - id             │         │ - ip_address             │        │
│  │ - employee_id    │         │ - user_agent             │        │
│  │ - first_name     │         │ - created_at             │        │
│  │ - last_name      │         └──────────────────────────┘        │
│  │ - email          │                                              │
│  │ - position       │                                              │
│  │ - ...            │                                              │
│  └──────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication Workflows

### 1. User Registration Flow

```
User                  UI                    API                   Database
  │                   │                     │                        │
  │  Fill form        │                     │                        │
  │─────────────────→ │                     │                        │
  │                   │ POST /register      │                        │
  │                   │────────────────────→│                        │
  │                   │                     │ Validate input         │
  │                   │                     │ Check duplicates       │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create employee record │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create user account    │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create audit log       │
  │                   │                     │──────────────────────→ │
  │                   │ Success response    │                        │
  │                   │←────────────────────│                        │
  │  Success message  │                     │                        │
  │←─────────────────│                     │                        │
  │  Redirect login   │                     │                        │
  │←─────────────────│                     │                        │
```

### 2. Forgot Password Flow

```
User                  UI                    API                   Database
  │                   │                     │                        │
  │  Enter email      │                     │                        │
  │─────────────────→ │                     │                        │
  │                   │ POST /forgot-pwd    │                        │
  │                   │────────────────────→│                        │
  │                   │                     │ Find user by email     │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Generate token         │
  │                   │                     │ Create reset record    │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create audit log       │
  │                   │                     │──────────────────────→ │
  │                   │ Token + link (dev)  │                        │
  │                   │←────────────────────│                        │
  │  Show success     │                     │                        │
  │  Display token    │                     │                        │
  │←─────────────────│                     │                        │
```

### 3. Reset Password Flow

```
User                  UI                    API                   Database
  │                   │                     │                        │
  │  Click reset link │                     │                        │
  │  (with token)     │                     │                        │
  │─────────────────→ │                     │                        │
  │                   │                     │                        │
  │  Enter new pwd    │                     │                        │
  │─────────────────→ │                     │                        │
  │                   │ POST /reset-pwd     │                        │
  │                   │ + token + new pwd   │                        │
  │                   │────────────────────→│                        │
  │                   │                     │ Validate token         │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Update password        │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Mark token as used     │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Delete all sessions    │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create audit log       │
  │                   │                     │──────────────────────→ │
  │                   │ Success response    │                        │
  │                   │←────────────────────│                        │
  │  Show success     │                     │                        │
  │  Redirect login   │                     │                        │
  │←─────────────────│                     │                        │
```

### 4. Profile Update Flow

```
User                  UI                    API                   Database
  │                   │                     │                        │
  │  Edit profile     │                     │                        │
  │─────────────────→ │                     │                        │
  │                   │ PUT /profile        │                        │
  │                   │ + session cookie    │                        │
  │                   │────────────────────→│                        │
  │                   │                     │ Verify session         │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Update user profile    │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create audit log       │
  │                   │                     │──────────────────────→ │
  │                   │ Success response    │                        │
  │                   │←────────────────────│                        │
  │  Show success     │                     │                        │
  │←─────────────────│                     │                        │
```

### 5. Change Password Flow

```
User                  UI                    API                   Database
  │                   │                     │                        │
  │  Enter passwords  │                     │                        │
  │  (current + new)  │                     │                        │
  │─────────────────→ │                     │                        │
  │                   │ POST /change-pwd    │                        │
  │                   │ + session cookie    │                        │
  │                   │────────────────────→│                        │
  │                   │                     │ Verify session         │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Get user with hash     │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Verify current pwd     │
  │                   │                     │                        │
  │                   │                     │ Update password        │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Delete old sessions    │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create new session     │
  │                   │                     │──────────────────────→ │
  │                   │                     │                        │
  │                   │                     │ Create audit log       │
  │                   │                     │──────────────────────→ │
  │                   │ Success response    │                        │
  │                   │←────────────────────│                        │
  │  Show success     │                     │                        │
  │←─────────────────│                     │                        │
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Input Validation (Frontend)                           │
│ • Form validation with Ant Design                              │
│ • Real-time feedback                                            │
│ • Required fields, email format, password strength             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: API Validation (Backend)                              │
│ • Re-validate all inputs                                        │
│ • Check data types and formats                                  │
│ • Verify business logic constraints                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Authentication (Session/Token)                        │
│ • Verify session cookies                                        │
│ • Check token expiration                                        │
│ • Validate user identity                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Authorization (Permissions)                           │
│ • Check user permissions                                        │
│ • Verify role-based access                                      │
│ • Ensure user owns resource                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: Data Protection (Encryption)                          │
│ • Hash passwords with bcrypt                                    │
│ • Generate secure tokens                                        │
│ • Protect sensitive data                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 6: Audit Logging (Tracking)                              │
│ • Log all authentication events                                 │
│ • Track IP addresses and user agents                            │
│ • Create audit trail for compliance                             │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

```
┌────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                          │
│  • React 19 (UI Components)                                    │
│  • Ant Design 6.1.0 (UI Framework)                            │
│  • TypeScript (Type Safety)                                    │
│  • Tailwind CSS 4.1.18 (Styling)                              │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                        Backend Layer                           │
│  • Astro 5.13.5 (Full-stack Framework)                        │
│  • Cloudflare Adapter (Serverless)                             │
│  • bcryptjs (Password Hashing)                                 │
│  • crypto (Token Generation)                                   │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                        Database Layer                          │
│  • Cloudflare D1 (SQLite)                                      │
│  • Wrangler CLI (Database Management)                          │
│  • SQL Prepared Statements (Security)                          │
└────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: January 15, 2025
