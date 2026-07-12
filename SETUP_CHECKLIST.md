# Docmobi Admin Dashboard - Setup Checklist

## Pre-Setup Requirements

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Backend API running on `http://localhost:3001`
- [ ] Socket.IO server configured on backend
- [ ] Database setup and migrations completed

## Installation & Configuration

### Step 1: Install Dependencies
```bash
npm install
```

**Verify**: 
- [ ] All dependencies installed without errors
- [ ] node_modules folder created
- [ ] package-lock.json updated

### Step 2: Create Environment File

Create `.env.local` in project root:

```bash
# Copy and fill in these values:
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

**Verify**:
- [ ] `.env.local` file created
- [ ] All four variables set
- [ ] NEXTAUTH_SECRET is at least 32 characters
- [ ] URLs point to correct backend

### Step 3: Build Project

```bash
npm run build
```

**Verify**:
- [ ] Build completes without errors
- [ ] `.next` folder created
- [ ] No TypeScript errors
- [ ] No eslint warnings

### Step 4: Start Development Server

```bash
npm run dev
```

**Verify**:
- [ ] Server starts on `http://admin.docmobidz.com`
- [ ] No console errors
- [ ] No warnings in terminal

## Application Testing

### Authentication Tests

#### Test Login
1. [ ] Navigate to `http://admin.docmobidz.com/login`
2. [ ] Page loads correctly
3. [ ] Try invalid credentials (should show error)
4. [ ] Login with `admin@example.com` / `123456`
5. [ ] Redirects to `/dashboard`
6. [ ] Session is created (visible in DevTools Application tab)

#### Test Forgot Password
1. [ ] Click "Forgot password?" link
2. [ ] Enter email address
3. [ ] Verify OTP screen appears
4. [ ] Enter OTP
5. [ ] Reset password screen appears
6. [ ] Enter new passwords
7. [ ] Should redirect to login

#### Test Remember Me
1. [ ] Login with "Remember me" checked
2. [ ] Email should be pre-filled on next login attempt
3. [ ] localStorage should have `rememberMe` and `savedEmail`

#### Test Logout
1. [ ] Click logout button in sidebar
2. [ ] Should redirect to `/login`
3. [ ] Session should be cleared
4. [ ] Cannot access `/dashboard` without login

### Dashboard Tests

#### Test Dashboard Home
1. [ ] Navigate to `/dashboard`
2. [ ] Page loads with stats
3. [ ] Charts display correctly
4. [ ] No console errors

#### Test Doctor Management
1. [ ] Navigate to `/dashboard/doctors`
2. [ ] Doctor list loads with pagination
3. [ ] Search functionality works
4. [ ] Status filter works
5. [ ] Can approve/reject doctors
6. [ ] Pagination controls work

#### Test Patient Management
1. [ ] Navigate to `/dashboard/patients`
2. [ ] Patient list loads
3. [ ] Search works
4. [ ] Can block/unblock patients
5. [ ] Status filter works
6. [ ] Pagination works

#### Test Appointments
1. [ ] Navigate to `/dashboard/appointments`
2. [ ] Appointments load with dates
3. [ ] Can search by patient name
4. [ ] Can filter by status
5. [ ] Can cancel appointments
6. [ ] Status updates reflect in table

#### Test Earnings
1. [ ] Navigate to `/dashboard/earnings`
2. [ ] Doctor earnings display
3. [ ] Can toggle weekly/monthly view
4. [ ] Stats update correctly
5. [ ] Charts render properly

#### Test Categories
1. [ ] Navigate to `/dashboard/categories`
2. [ ] Categories list loads
3. [ ] Can search categories
4. [ ] Can toggle status
5. [ ] Can add new category
6. [ ] Can edit category
7. [ ] Can delete category

#### Test Settings
1. [ ] Navigate to `/dashboard/settings`
2. [ ] Change password form displays
3. [ ] Enter old and new passwords
4. [ ] Submit and verify success message
5. [ ] Can logout and login with new password

### Notifications Tests

#### Test Notification Display
1. [ ] Click notification bell icon
2. [ ] Dropdown opens showing notifications
3. [ ] Unread count shows correctly
4. [ ] Can mark individual notification as read
5. [ ] Can mark all as read
6. [ ] Read notifications don't show as unread

#### Test Real-Time Updates
1. [ ] Open browser DevTools (Network tab)
2. [ ] Look for WebSocket connection to Socket.IO
3. [ ] Should see `socket.io` messages
4. [ ] New notifications should appear in real-time
5. [ ] Notification count updates instantly

#### Test Toast Notifications
1. [ ] Perform actions (approve doctor, block patient, etc.)
2. [ ] Toast notifications appear at top-right
3. [ ] Messages are appropriate
4. [ ] Toast auto-dismisses after few seconds

### Responsive Design Tests

#### Desktop (1920px)
- [ ] All elements visible
- [ ] No horizontal scrolling
- [ ] Sidebar visible
- [ ] Full width tables

#### Tablet (768px)
- [ ] Sidebar toggles to hamburger menu
- [ ] Table columns visible
- [ ] Mobile menu works
- [ ] Responsive layout applied

#### Mobile (375px)
- [ ] All functionality accessible
- [ ] Touch-friendly buttons
- [ ] Tables scrollable horizontally
- [ ] No content hidden

### Performance Tests

#### Page Load Time
- [ ] Dashboard loads in < 2 seconds
- [ ] API calls complete quickly
- [ ] No layout shift
- [ ] Skeleton loaders show

#### Query Caching
- [ ] Second visit to page loads from cache
- [ ] Refetch only happens after 5 minutes
- [ ] Manual refetch works (pull-to-refresh)

## API Verification

### Test Backend Connection

```bash
# Test auth endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"123456"}'
```

**Verify**:
- [ ] Backend is running
- [ ] Returns valid JWT tokens
- [ ] CORS is configured

### Test Notifications API

```bash
# Test notifications endpoint (requires auth)
curl -X GET http://localhost:3001/api/notification \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify**:
- [ ] Returns notification array
- [ ] Pagination info included
- [ ] Response format matches expected structure

## Browser DevTools Checks

### Application Tab
- [ ] Session cookie visible
- [ ] No localStorage tokens (old auth removed)
- [ ] Secure flag set on session cookie

### Network Tab
- [ ] API requests have Authorization header
- [ ] Socket.IO WebSocket connected
- [ ] No 401 Unauthorized errors
- [ ] No CORS errors

### Console Tab
- [ ] No JavaScript errors
- [ ] No warnings about missing props
- [ ] No deprecation warnings

### React DevTools
- [ ] Component tree visible
- [ ] No state warnings
- [ ] Props displayed correctly

## Security Checklist

- [ ] NEXTAUTH_SECRET is set (not default)
- [ ] NEXTAUTH_SECRET is >= 32 characters
- [ ] No credentials hardcoded in code
- [ ] API keys not exposed in client
- [ ] Session cookies are httpOnly
- [ ] CSRF tokens present
- [ ] Passwords hashed on backend
- [ ] OTP verification working

## Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Environment variables configured
- [ ] Backend API in production
- [ ] Socket.IO server accessible

### Vercel Deployment
```bash
npm run build  # Verify builds successfully
vercel deploy
```

**Configure on Vercel Dashboard**:
- [ ] Add NEXTAUTH_URL = https://your-domain.com
- [ ] Add NEXTAUTH_SECRET
- [ ] Add NEXT_PUBLIC_BASE_URL
- [ ] Add NEXT_PUBLIC_SOCKET_URL
- [ ] Set domain and SSL

### Post-Deployment
- [ ] Test login on production
- [ ] Test API calls work
- [ ] Notifications working
- [ ] Monitor error logs
- [ ] Set up error tracking (Sentry, etc.)

## Troubleshooting Checklist

### If Getting Chunk Errors
- [ ] Clear `.next` folder: `rm -rf .next`
- [ ] Rebuild: `npm run build`
- [ ] Restart dev server: `npm run dev`
- [ ] Check for server-only code in client components
- [ ] Verify no dynamic imports issues

### If Login Not Working
- [ ] Backend login endpoint responding
- [ ] NEXTAUTH_SECRET is set
- [ ] Database with users configured
- [ ] Check browser console for errors
- [ ] Verify credentials in backend

### If Notifications Not Showing
- [ ] Backend Socket.IO server running
- [ ] NEXT_PUBLIC_SOCKET_URL correct
- [ ] Socket.IO connected in DevTools
- [ ] Notifications API endpoint working
- [ ] Check server logs for socket errors

### If API Calls Failing
- [ ] Backend running on correct port
- [ ] NEXT_PUBLIC_BASE_URL correct
- [ ] CORS configured on backend
- [ ] Authentication headers being sent
- [ ] Token not expired

### If Styling Issues
- [ ] Tailwind CSS compiled: `npm run build`
- [ ] globals.css imported in layout.tsx
- [ ] No conflicting CSS classes
- [ ] Theme tokens defined in globals.css

## Final Verification

Run this checklist before marking as complete:

- [ ] All pages load without errors
- [ ] Authentication flow works end-to-end
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Search and filter functionality works
- [ ] Pagination works on all pages
- [ ] Real-time notifications appear
- [ ] Responsive design works on all screen sizes
- [ ] Performance is acceptable (< 3s page load)
- [ ] No console errors or warnings
- [ ] Environment variables properly configured
- [ ] Production build completes successfully

## Documentation to Review

Before going live, read these files:

1. [ ] `/NEXTAUTH_SETUP.md` - Complete NextAuth guide
2. [ ] `/MIGRATION_GUIDE.md` - Changes from previous auth
3. [ ] `/IMPLEMENTATION_SUMMARY.md` - Feature overview
4. [ ] `/README.md` - General project info

## Support Contacts

For issues with:

- **Frontend Issues**: Review browser console and check component files
- **Backend Issues**: Check backend logs and API endpoints
- **Socket.IO Issues**: Verify server configuration and network connection
- **NextAuth Issues**: See `/NEXTAUTH_SETUP.md` and official docs at authjs.dev

## Sign-Off

- [ ] All checks completed
- [ ] No critical issues remaining
- [ ] Ready for deployment
- [ ] Team notified of deployment
- [ ] Backup of production data taken

---

**Completed By**: ________________
**Date**: ________________
**Notes**:
