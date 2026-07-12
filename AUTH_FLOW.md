# Authentication Flow Documentation

## Overview
This document describes the complete authentication and password reset flow in the Docmobi Admin Dashboard.

## Authentication Pages

### 1. Login Page (`/app/login/page.tsx`)
**Purpose**: User credentials entry and authentication

**Flow**:
- User enters email and password
- Optional "Remember Me" checkbox to save email
- Calls `signIn()` from NextAuth.js with credentials provider
- On success: Redirects to `/dashboard`
- On failure: Shows toast error message

**Key Features**:
- Email/password validation
- Remember me functionality (stores email in localStorage)
- Link to forgot password page
- Loading state with disabled submit button

### 2. Forgot Password Page (`/app/forgot-password/page.tsx`)
**Purpose**: Multi-step password reset flow

**Steps**:
1. **Email Entry**: User enters email address
   - Calls `authAPI.forgotPassword(email)`
   - Backend sends OTP to email
   - Moves to step 2

2. **OTP Verification**: User enters 6-digit code
   - Calls `authAPI.verifyOTP(email, otp)`
   - Validates OTP from email
   - Moves to step 3

3. **Password Reset**: User sets new password
   - Calls `authAPI.resetPassword(email, otp, password)`
   - Password validated (min 6 characters)
   - Redirects to login on success

### 3. OTP Verification Page (`/app/verify-otp/page.tsx`)
**Purpose**: Dedicated OTP input with 6 separate input boxes

**Features**:
- 6 individual digit input boxes
- Auto-focus next input on digit entry
- Auto-focus previous input on backspace
- 5-minute countdown timer
- "Resend OTP" button (enabled when timer expires)
- Real-time validation of OTP code

### 4. Reset Password Page (`/app/reset-password/page.tsx`)
**Purpose**: Final password reset with password strength validation

**Features**:
- New password input with visibility toggle
- Confirm password input with visibility toggle
- Real-time password match validation
- Minimum 6 character requirement
- Eye icon toggle for password visibility

## API Endpoints

### Authentication Endpoints

#### 1. Login
- **Endpoint**: `POST /auth/login`
- **Payload**: `{ email: string, password: string }`
- **Response**: `{ accessToken: string, refreshToken: string, user: Object }`

#### 2. Forgot Password (Send OTP)
- **Endpoint**: `POST /auth/forget` or `/auth/send-otp`
- **Payload**: `{ email: string }`
- **Response**: `{ message: string }`

#### 3. Verify OTP
- **Endpoint**: `POST /auth/verify-otp`
- **Payload**: `{ email: string, otp: string }`
- **Response**: `{ message: string }`

#### 4. Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Payload**: `{ email: string, otp: string, password: string }`
- **Response**: `{ message: string }`

#### 5. Change Password (Authenticated)
- **Endpoint**: `POST /auth/change-password`
- **Payload**: `{ oldPassword: string, newPassword: string }`
- **Response**: `{ message: string }`
- **Auth**: Requires valid session token

## Session Management

### NextAuth.js Configuration
- **Strategy**: JWT with credentials provider
- **Session Duration**: 24 hours
- **Stored in**: HTTP-only cookie (secure by default)
- **Custom Claims**: `accessToken` added to session

### Token Handling
1. On login, backend returns `accessToken`
2. NextAuth.js stores in JWT callback
3. Session includes `accessToken` for API calls
4. Automatic Authorization header injection in axios interceptor

## Route Protection

### Public Routes (No Authentication Required)
- `/login`
- `/forgot-password`
- `/verify-otp`
- `/reset-password`

### Protected Routes (Requires Authentication)
- `/dashboard` (and all sub-routes)
- `/dashboard/doctors`
- `/dashboard/patients`
- `/dashboard/appointments`
- `/dashboard/earnings`
- `/dashboard/categories`
- `/dashboard/settings`

### Route Redirect Logic
Using `proxy.ts` (Next.js 16 edge middleware):
- Unauthenticated users accessing protected routes → Redirect to `/login`
- Authenticated users accessing public auth routes → Redirect to `/dashboard`

## API Client Integration

### Axios Instance with Interceptors

**Request Interceptor**:
```typescript
// Auto-injects session token
config.headers.Authorization = `Bearer ${session?.accessToken}`
```

**Response Interceptor**:
```typescript
// Redirects to login on 401 (Unauthorized)
if (error.response?.status === 401) {
  window.location.href = "/login"
}
```

## Real-Time Notifications

### Socket.IO Integration
- **Connection URL**: `process.env.NEXT_PUBLIC_SOCKET_URL`
- **Events**:
  - `new-notification`: Receives new notifications
  - `notification-read`: Updates read status
  - `notification-read-all`: Clears all unread

### Notification API Endpoints
- **Get Notifications**: `GET /notification?isRead=true|false&page=1&limit=20`
- **Mark as Read**: `PATCH /notification/:id/read`
- **Mark All as Read**: `PATCH /notification/read-all`

## Environment Variables

Required in `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=your-secret-key-here

# API Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api

# Socket.IO (Optional for real-time features)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Validation Rules

### Password Requirements
- Minimum 6 characters
- Must match confirmation password
- Special characters recommended (enforced server-side)

### OTP Requirements
- Must be 6 digits
- Valid for 5 minutes from issuance
- Can be resent if expired

### Email Requirements
- Valid email format
- Must exist in system for login
- Used for OTP delivery

## Error Handling

### Common Error Messages
| Error | Cause | Resolution |
|-------|-------|-----------|
| "Invalid email or password" | Wrong credentials | Check email/password |
| "Invalid OTP" | Incorrect 6-digit code | Request new OTP |
| "OTP expired" | Code valid for 5 min only | Click "Resend OTP" |
| "Passwords do not match" | Mismatch in reset form | Re-enter both passwords |
| "Password too short" | Less than 6 characters | Use at least 6 characters |

## Security Features

1. **JWT Authentication**: Secure token-based auth
2. **HTTP-only Cookies**: Prevents XSS token theft
3. **CSRF Protection**: NextAuth.js built-in
4. **Password Hashing**: Backend handles with bcrypt
5. **Rate Limiting**: Recommended backend implementation
6. **HTTPS Only**: Required in production
7. **Session Expiration**: 24-hour automatic logout
8. **Token Refresh**: Automatic on valid requests

## Testing the Flow

### Step-by-Step Test

1. **Login Flow**:
   ```
   Navigate to http://admin.docmobidz.com/login
   Enter: admin@example.com
   Enter: 123456
   Click "Log In"
   → Should redirect to /dashboard
   ```

2. **Forgot Password Flow**:
   ```
   Click "Forgot your password?" on login page
   Enter email → Click "Send OTP"
   Enter 6-digit code → Click "Verify OTP"
   Enter new password → Click "Reset Password"
   → Should redirect to /login
   ```

3. **Protected Route Access**:
   ```
   Without login, visit http://admin.docmobidz.com/dashboard
   → Should redirect to /login
   ```

4. **Session Persistence**:
   ```
   Login and refresh page
   → Should stay logged in (session cookie valid)
   ```

## Troubleshooting

### Common Issues

**"ChunkLoadError" on page transition**
- Clear browser cache
- Restart development server
- Check Next.js version compatibility

**Session not persisting**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches localhost
- Clear cookies and try again

**API calls returning 401**
- Session may be expired
- Try logging out and back in
- Check NEXT_PUBLIC_BASE_URL is correct

**OTP not received**
- Check email spam/junk folder
- Verify email address is correct
- Click "Resend OTP" button

## File Structure

```
/app
  /login
    page.tsx              # Login form
  /forgot-password
    page.tsx              # Multi-step forgot password
  /verify-otp
    page.tsx              # OTP input (6 digits)
    loading.tsx           # Suspense boundary
  /reset-password
    page.tsx              # Password reset form
    loading.tsx           # Suspense boundary
  /auth/[...nextauth]
    route.ts              # NextAuth configuration
  /dashboard
    layout.tsx            # Protected layout
    page.tsx              # Dashboard home
    # ... other pages

/lib
  api-client.ts           # Axios instance with interceptors
  api.ts                  # Old API (legacy)

/types
  next-auth.d.ts          # TypeScript definitions

/middleware.ts            # Route protection (deprecated)
/proxy.ts                 # Next.js 16 edge middleware

.env.local                # Environment variables
```

## Future Enhancements

1. **Two-Factor Authentication**: SMS/Email 2FA option
2. **OAuth Integration**: Google/GitHub sign-in
3. **Password Strength Meter**: Real-time feedback
4. **Biometric Login**: Fingerprint/Face ID (mobile)
5. **Login History**: Track login attempts
6. **Session Management**: Multiple device support
7. **Passwordless Auth**: Magic links via email
