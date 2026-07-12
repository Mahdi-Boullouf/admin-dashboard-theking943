# OTP and Reset Password Pages - Implementation Guide

## Overview
Two dedicated authentication pages have been created to handle OTP verification and password reset with beautiful UI matching the Docmobi design system.

## Pages Created

### 1. OTP Verification Page (`/app/verify-otp/page.tsx`)

**Route**: `/verify-otp?email=user@example.com`

**Purpose**: Allow users to enter 6-digit OTP sent to their email

**Key Features**:
- 6 individual input boxes for OTP digits
- Auto-advance to next field on digit entry
- Auto-go back to previous field on backspace
- 5-minute countdown timer
- "Resend OTP" button (enabled when timer expires)
- Real-time validation
- Loading states
- Error handling with toast notifications

**User Interaction**:
1. User arrives at page via redirect from forgot-password
2. Enters 6-digit code (one digit per box)
3. Code automatically validates when all 6 digits entered
4. Clicks "Log In" button to verify OTP
5. On success: Redirected to reset-password page
6. On failure: Shows error toast, can retry or resend OTP

**API Calls**:
- `authAPI.verifyOTP(email, otpCode)` - Verify OTP code
- `authAPI.sendOTP(email)` - Resend OTP when timer expires

**Styling**:
- Light blue/cyan gradient background
- White card container with shadow
- Blue primary buttons
- Docmobi logo at top
- Responsive design (mobile-first)

### 2. Reset Password Page (`/app/reset-password/page.tsx`)

**Route**: `/reset-password?email=user@example.com&otp=123456`

**Purpose**: Allow users to set a new password after OTP verification

**Key Features**:
- New password input with visibility toggle
- Confirm password input with visibility toggle
- Password requirements: Minimum 6 characters
- Real-time validation:
  - Checks password length
  - Validates password match
  - Shows error messages dynamically
- Eye icon toggle for password visibility
- Loading states
- Error handling with toast notifications

**User Interaction**:
1. User arrives at page after OTP verification
2. Enters new password
3. Enters confirmation password
4. System validates:
   - Both passwords are filled
   - Passwords match
   - Password is at least 6 characters
5. Clicks "Continue" button
6. On success: Redirected to login page with success message
7. On failure: Shows error toast, can retry

**API Calls**:
- `authAPI.resetPassword(email, otp, password)` - Reset password

**Styling**:
- Same blue/cyan gradient as OTP page
- Consistent card design
- Eye icon button for password visibility
- Real-time validation feedback
- Red error text for validation failures

## Component Structure

Both pages use:
- Next.js 'use client' directive (client component)
- React hooks (useState, useRef, useEffect)
- NextAuth session management
- Axios API client with interceptors
- Sonner for toast notifications
- Lucide React icons
- Tailwind CSS for styling

## Integration Points

### With NextAuth.js
- No session required (public routes)
- Redirect to `/reset-password` after OTP verification
- Redirect to `/login` after password reset success

### With API Client
```typescript
// API methods in lib/api-client.ts
authAPI.sendOTP(email)
authAPI.verifyOTP(email, otp)
authAPI.resetPassword(email, otp, password)
```

### With Form Flow
```
Login Page (/login)
  ↓ Click "Forgot password?"
Forgot Password (/forgot-password) - Step 1: Email
  ↓ Submit email
Forgot Password - Step 2: OTP OR Direct to /verify-otp
  ↓ Enter 6-digit code
Forgot Password - Step 3: Password OR Direct to /reset-password
  ↓ Enter new password
Login Page (/login)
```

## Validation Rules

### OTP
- Must be exactly 6 digits
- Numbers only (0-9)
- Cannot be empty
- Has 5-minute expiration
- Can be resent after expiration

### Password
- Minimum 6 characters
- Must match confirmation
- No special character requirements (enforced server-side)
- Case-sensitive

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=<32+ char secret>
```

## Error Handling

### OTP Page
| Scenario | Error Message | Action |
|----------|---------------|--------|
| Empty OTP | "Please enter all 6 digits" | Retry |
| Invalid OTP | "Invalid OTP" (from API) | Show error, can resend |
| Missing email | "Email not found..." | Redirect to forgot password |

### Reset Password Page
| Scenario | Error Message | Action |
|----------|---------------|--------|
| Passwords don't match | "Passwords do not match" | Fix and retry |
| Password too short | "Password must be at least 6 characters" | Increase length |
| Missing fields | "Please fill in all fields" | Complete form |
| Invalid request | "Invalid reset request..." | Redirect to forgot password |

## Timer Implementation

The OTP page includes a 5-minute countdown timer:
```typescript
// 300 seconds = 5 minutes
const [timeLeft, setTimeLeft] = useState(300);

// Updates every second
useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
  }, 1000);
  return () => clearInterval(timer);
}, []);

// Display format: "4:32" (4 minutes 32 seconds)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

## Loading States

Both pages handle loading states:
- Button becomes disabled during API calls
- Text changes to show progress (e.g., "Verifying..." → "Resending...")
- Input fields are disabled during loading
- Prevents duplicate submissions

## Accessibility Features

- Proper label elements for inputs
- Type="text" with inputMode="numeric" for OTP (mobile keyboard)
- Keyboard navigation support
- Focus management
- Error messages tied to inputs
- Screen reader friendly

## Testing the Pages

### Test OTP Page
1. Navigate to `/forgot-password`
2. Enter email and click "Send OTP"
3. Enter 6-digit code in OTP page
4. Verify redirects to reset-password on success
5. Test timer countdown
6. Test "Resend OTP" after timer expires

### Test Reset Password Page
1. Navigate to `/reset-password?email=test@example.com&otp=123456`
2. Enter mismatched passwords → See error
3. Enter short password → See error
4. Enter valid passwords → See success and redirect

## Files Created/Modified

**New Files**:
- `/app/verify-otp/page.tsx` - OTP page (199 lines)
- `/app/verify-otp/loading.tsx` - Suspense boundary
- `/app/reset-password/page.tsx` - Reset password page (187 lines)
- `/app/reset-password/loading.tsx` - Suspense boundary

**Modified Files**:
- `/lib/api-client.ts` - Added `sendOTP()` method

**Documentation**:
- `/AUTH_FLOW.md` - Complete authentication flow
- `/OTP_RESET_PASSWORD_PAGES.md` - This document

## Styling Details

### Color Scheme
- **Background**: Gradient from blue-50 to cyan-50
- **Cards**: White with shadow
- **Buttons**: Blue-600 (primary), transparent (secondary)
- **Text**: Dark gray for body, blue-600 for headings
- **Borders**: Blue-200 for inputs, blue-600 on focus
- **Errors**: Red-500 for validation messages

### Responsive Design
- Mobile first approach
- Max-width: 28rem (md breakpoint)
- Padding: 1rem on mobile, auto-centered
- Touch-friendly button sizes (py-3)
- Adequate spacing between elements

## Security Considerations

1. **OTP Security**:
   - 6-digit code is sufficient with rate limiting
   - 5-minute expiration prevents brute force
   - Backend validates all OTP attempts

2. **Password Reset**:
   - Email + OTP required (two-factor)
   - OTP tied to email to prevent hijacking
   - New password sent to backend for hashing

3. **URL Parameters**:
   - Email and OTP in URL (acceptable for POST data)
   - Should use POST body in production
   - HTTPS required in production

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with auto-focus

## Future Enhancements

1. Add password strength meter
2. Support for SMS OTP
3. OTP copy from email (auto-fill on mobile)
4. Rate limiting display
5. Account lockout warning
6. Login attempt history
7. Two-factor authentication options
