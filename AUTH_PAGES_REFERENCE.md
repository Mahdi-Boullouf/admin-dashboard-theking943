# Authentication Pages - Quick Reference

## All Auth Pages at a Glance

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Login | `/login` | Email/password authentication | Complete |
| Forgot Password | `/forgot-password` | Multi-step password reset | Complete |
| OTP Verification | `/verify-otp` | 6-digit OTP validation | Complete |
| Reset Password | `/reset-password` | New password entry | Complete |

## Page Specifications

### Login Page (`/app/login/page.tsx`)
```
Route: /login
Method: POST (NextAuth credentials)
Features:
  - Email input
  - Password input with visibility toggle
  - Remember me checkbox
  - Forgot password link
  - Loading state
  - Error handling
```

**Workflow**:
1. User enters email & password
2. Clicks "Log In" or press Enter
3. NextAuth validates with backend
4. On success → `/dashboard`
5. On failure → Show error toast

### Forgot Password Page (`/app/forgot-password/page.tsx`)
```
Route: /forgot-password
Method: POST (multi-step)
Features:
  - 3-step form (email → OTP → password)
  - Timer countdown on OTP step
  - Resend OTP button
  - Back navigation
  - Loading states
```

**Step 1 - Email**:
- User enters email
- Calls `authAPI.forgotPassword(email)`
- Backend sends OTP

**Step 2 - OTP**:
- User enters 6-digit code
- Can resend if timer expires
- Calls `authAPI.verifyOTP(email, otp)`

**Step 3 - Password**:
- User enters new password
- Confirms password match
- Calls `authAPI.resetPassword(email, otp, password)`
- Redirects to `/login`

### OTP Page (`/app/verify-otp/page.tsx`)
```
Route: /verify-otp?email=user@example.com
Method: POST
Features:
  - 6 individual input boxes
  - Auto-advance between boxes
  - Auto-retreat on backspace
  - 5-minute countdown timer
  - Resend OTP button
  - Real-time validation
  - Back to login link
```

**Input Handling**:
- Only accepts digits 0-9
- Auto-focus next box when digit entered
- Auto-focus previous box when backspace pressed
- Validates complete 6-digit code

**Timer Logic**:
- Starts at 5:00 (300 seconds)
- Decrements every second
- "Resend OTP" button enabled at 0:00
- Clicking resend resets timer to 5:00

### Reset Password Page (`/app/reset-password/page.tsx`)
```
Route: /reset-password?email=user@example.com&otp=123456
Method: POST
Features:
  - Password input with visibility toggle
  - Confirm password with visibility toggle
  - Real-time validation feedback
  - Minimum 6 character requirement
  - Password match validation
  - Loading state
  - Back to login link
```

**Validation**:
- Requires both passwords filled
- Minimum 6 characters
- Passwords must match
- Submit button disabled until valid

## API Endpoints Used

### Authentication APIs
```typescript
// 1. Login
POST /auth/login
{email, password}
→ {accessToken, refreshToken, user}

// 2. Send OTP (Forgot Password)
POST /auth/forget
{email}
→ {message}

// 3. Send OTP (Alternative endpoint)
POST /auth/send-otp
{email}
→ {message}

// 4. Verify OTP
POST /auth/verify-otp
{email, otp}
→ {message}

// 5. Reset Password
POST /auth/reset-password
{email, otp, password}
→ {message}

// 6. Change Password (Authenticated)
POST /auth/change-password
{oldPassword, newPassword}
→ {message}
Auth: Bearer {accessToken}
```

## User Flows

### Login Flow
```
1. User at /login
2. Enter email: admin@example.com
3. Enter password: 123456
4. Click "Log In"
5. NextAuth validates with backend
6. Response: {accessToken, user}
7. NextAuth stores token in session
8. User redirected to /dashboard
```

### Forgot Password Flow (Multi-step)
```
1. User at /login
2. Click "Forgot your password?"
3. Redirected to /forgot-password
4. Enter email → Click "Send OTP"
   ├─ Backend sends OTP to email
   └─ Move to Step 2
5. Enter 6-digit code → Click "Verify OTP"
   ├─ Backend validates OTP
   └─ Move to Step 3
6. Enter new password → Click "Reset Password"
   ├─ Backend hashes and saves password
   └─ Redirected to /login
```

### Forgot Password Flow (Standalone Pages)
```
1. User at /forgot-password → Fill email
2. Backend sends OTP
3. Redirect to /verify-otp?email=user@example.com
4. User enters 6-digit code
5. Backend validates OTP
6. Redirect to /reset-password?email=...&otp=...
7. User enters new password
8. Backend saves password
9. Redirect to /login
```

## Component Usage

### Files to Import
```typescript
import { toast } from 'sonner'                    // Notifications
import { useRouter, useSearchParams } from 'next/navigation'  // Navigation
import { signIn } from 'next-auth/react'          // NextAuth
import { authAPI } from '@/lib/api-client'        // API calls
import { Button } from '@/components/ui/button'   // UI components
import { Eye, EyeOff } from 'lucide-react'        // Icons
```

### Form Pattern
```typescript
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validation
  if (!field) {
    toast.error('Field required')
    return
  }
  
  setIsLoading(true)
  try {
    // API call
    const response = await authAPI.someMethod(...)
    toast.success('Success message')
    router.push('/next-page')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error')
  } finally {
    setIsLoading(false)
  }
}
```

## Styling Classes Used

### Layout
- `min-h-screen` - Full screen height
- `flex items-center justify-center` - Center content
- `bg-gradient-to-br from-blue-50 to-cyan-50` - Background

### Card
- `bg-white rounded-xl shadow-lg p-8` - Card styling
- `max-w-md w-full` - Responsive width

### Inputs
- `px-4 py-3 border-2 border-blue-200 rounded-lg` - Input styling
- `focus:outline-none focus:border-blue-600` - Focus states
- `focus:ring-2 focus:ring-blue-500/20` - Focus ring

### Buttons
- `bg-blue-600 hover:bg-blue-700` - Primary button
- `py-3 rounded-lg transition-colors` - Button styling
- `disabled:opacity-50 disabled:cursor-not-allowed` - Disabled state

### Text
- `text-2xl font-bold text-blue-600` - Heading
- `text-gray-600 text-center mb-6` - Description
- `text-sm text-gray-600` - Small text
- `text-red-500 text-sm mt-1` - Error text

## Common Issues & Solutions

### OTP Inputs Not Working
- Ensure `inputMode="numeric"` is set
- Check `maxLength={1}` on each input
- Verify ref assignment in map function

### Password Visibility Toggle
- Use Eye/EyeOff icons from lucide-react
- Toggle with `show{Field}` state
- Button positioned absolutely inside input

### Timer Countdown
- Initialize with `const [timeLeft, setTimeLeft] = useState(300)`
- Use `setInterval` with cleanup in useEffect
- Format with `Math.floor(seconds / 60)`

### Form Validation
- Use `disabled={isLoading || !field}` for submit button
- Show error messages conditionally
- Use real-time validation with onChange

### Loading States
- Set `isLoading` true during API call
- Disable inputs/buttons during loading
- Change button text (e.g., "Verifying...")
- Clear state in finally block

## Environment Setup

### .env.local
```env
# NextAuth Configuration
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# API Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api

# Optional: Socket.IO for notifications
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Backend Requirements
- Endpoints must return proper error messages
- Password hashing (bcrypt) required
- OTP generation and validation
- Email sending service
- Rate limiting recommended

## Testing Checklist

- [ ] Login page loads
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error
- [ ] "Remember me" saves email to localStorage
- [ ] Forgot password link navigates correctly
- [ ] OTP page has 6 input boxes
- [ ] OTP auto-advances between inputs
- [ ] OTP timer counts down from 5:00
- [ ] Resend OTP works after timer expires
- [ ] Password reset validates match
- [ ] Password reset validates length
- [ ] Final redirect to login page works
- [ ] All error messages display correctly
- [ ] Loading states work properly
- [ ] Mobile responsive design works

## Deployment Notes

1. **Environment Variables**: Set in Vercel/hosting provider
2. **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
3. **NEXTAUTH_URL**: Must match your domain (no trailing slash)
4. **API Base URL**: Point to production backend
5. **HTTPS Only**: Required for production
6. **Cookie Settings**: Configured for HTTPS in production

## Debugging Tips

### Enable Debug Logging
```typescript
// In authAPI calls
console.log('[v0] API Request:', {email, endpoint: '/auth/login'})
console.log('[v0] API Response:', response.data)
console.log('[v0] API Error:', error.response?.data)
```

### Check Network Tab
- Monitor XHR/Fetch requests
- Verify endpoint URLs
- Check request/response payloads
- Look for CORS errors

### NextAuth Debugging
- `NEXTAUTH_DEBUG=true` in .env
- Check cookies in browser DevTools
- Verify session with `useSession()`
- Check `/api/auth/session` endpoint

## File Locations

```
/app
├── /auth/[...nextauth]
│   └── route.ts              # NextAuth configuration
├── /login
│   └── page.tsx              # Login page
├── /forgot-password
│   └── page.tsx              # Multi-step forgot password
├── /verify-otp
│   ├── page.tsx              # OTP verification
│   └── loading.tsx           # Suspense boundary
├── /reset-password
│   ├── page.tsx              # Password reset
│   └── loading.tsx           # Suspense boundary
└── /dashboard
    ├── layout.tsx
    └── page.tsx

/lib
├── api-client.ts             # Axios + interceptors
└── api.ts                    # Legacy API

/types
└── next-auth.d.ts            # Type definitions

/proxy.ts                      # Route protection
```

## Performance Optimization

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Pages auto-split by route
3. **Lazy Loading**: Dynamic imports for heavy components
4. **Caching**: Session tokens cached in browser
5. **API Calls**: Minimal, only on form submit

## Security Best Practices

1. Never log credentials to console
2. Use HTTPS only in production
3. HTTP-only cookies for tokens
4. CSRF tokens with forms
5. Input validation on frontend
6. Rate limiting on backend
7. OTP expiration (5 minutes)
8. Password hashing with bcrypt
