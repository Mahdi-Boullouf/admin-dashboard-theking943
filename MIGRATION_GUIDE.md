# Authentication & Real-Time Migration Guide

## Overview

The dashboard has been refactored to use NextAuth.js v5 with Credentials provider and Socket.IO for real-time notifications instead of custom JWT handling.

## Key Changes

### 1. Authentication System

#### Before (Custom Auth)
- Manual JWT token storage in localStorage
- Custom axios interceptors for token management
- Manual token refresh logic
- No session management

#### After (NextAuth.js)
- NextAuth.js v5 with Credentials provider
- Automatic JWT session management
- Secure token storage (httpOnly cookies)
- Built-in token refresh capabilities
- Type-safe session handling

### 2. API Client

#### Before
```typescript
// lib/api.ts
const token = localStorage.getItem("accessToken");
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

#### After
```typescript
// lib/api-client.ts
const session = await getSession();
if (session?.accessToken) {
  config.headers.Authorization = `Bearer ${session.accessToken}`;
}
```

### 3. Login Page

#### Before
```typescript
const response = await authAPI.login(email, password);
const { accessToken, refreshToken } = response.data.data;
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);
```

#### After
```typescript
const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
});
if (result?.ok) {
  router.push("/dashboard");
}
```

### 4. Logout

#### Before
```typescript
const handleLogout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  router.push("/login");
};
```

#### After
```typescript
const handleLogout = async () => {
  await signOut({ callbackUrl: "/login" });
};
```

### 5. Notifications System

#### New Features Added
- Real-time notifications with Socket.IO
- Notification bell with unread count badge
- Mark as read/Mark all as read functionality
- Auto-refetch on new notifications
- Responsive notification dropdown

#### Files Added
- `/hooks/use-socket.ts` - Socket.IO connection hook
- `/components/notifications-dropdown.tsx` - Notification UI
- `/components/dashboard-header.tsx` - Header with notifications
- `/lib/api-client.ts` - Notifications API endpoints

### 6. Route Protection

#### Before
- Middleware checked localStorage tokens
- Vulnerable to XSS attacks

#### After
- Proxy checks NextAuth JWT tokens
- Secure httpOnly cookies
- Token-based route protection

## Setup Instructions

### 1. Install Dependencies

NextAuth.js v5 and socket.io-client should already be in package.json:

```bash
npm install next-auth socket.io-client
```

### 2. Environment Variables

Create `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Backend API
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Generate secret:
```bash
openssl rand -base64 32
```

### 3. File Changes Summary

#### New Files Created
- `/app/auth/[...nextauth]/route.ts` - NextAuth configuration
- `/lib/api-client.ts` - New API client with NextAuth
- `/types/next-auth.d.ts` - TypeScript definitions
- `/hooks/use-socket.ts` - Socket.IO hook
- `/components/notifications-dropdown.tsx` - Notifications UI
- `/components/dashboard-header.tsx` - Dashboard header
- `/NEXTAUTH_SETUP.md` - Detailed NextAuth guide
- `/MIGRATION_GUIDE.md` - This file

#### Modified Files
- `/components/providers.tsx` - Added SessionProvider
- `/app/layout.tsx` - Added Providers wrapper
- `/proxy.ts` - Updated for NextAuth JWT
- `/app/login/page.tsx` - Uses signIn() from next-auth
- `/app/forgot-password/page.tsx` - Uses api-client
- `/app/dashboard/layout.tsx` - Added DashboardHeader
- `/components/dashboard-sidebar.tsx` - Uses signOut() from next-auth
- `/app/dashboard/page.tsx` - Uses api-client
- `/app/dashboard/doctors/page.tsx` - Uses api-client
- `/app/dashboard/patients/page.tsx` - Uses api-client
- `/app/dashboard/appointments/page.tsx` - Uses api-client
- `/app/dashboard/categories/page.tsx` - Uses api-client
- `/app/dashboard/earnings/page.tsx` - Uses api-client
- `/app/dashboard/settings/page.tsx` - Uses api-client

#### Deprecated Files
- `/lib/api.ts` - No longer used (replaced by api-client.ts)

## Breaking Changes

### For Developers

1. **API Calls are now async**
   ```typescript
   // Before
   const client = getAxiosInstance();
   const response = await client.get('/endpoint');
   
   // After
   const client = await getApiClient();
   const response = await client.get('/endpoint');
   ```

2. **No More localStorage**
   - Remove all `localStorage.getItem('accessToken')`
   - Use `useSession()` instead
   - Tokens automatically managed by NextAuth

3. **Session Access**
   ```typescript
   // Before - Not applicable
   
   // After
   const { data: session } = useSession();
   const token = session?.accessToken;
   ```

4. **Component Updates**
   - All pages using APIs must update imports to use `api-client.ts`
   - Already done for all dashboard pages

## Real-Time Notifications

### Implementation Details

The notifications system works as follows:

1. **Initial Load**: TanStack Query fetches notifications from `/notification` API
2. **Real-Time Updates**: Socket.IO listens for `notification_new` events
3. **Cache Invalidation**: On new notification, cache is invalidated and refetched
4. **User Feedback**: Toast notification displayed for new notifications
5. **Mark as Read**: Can mark individual or all notifications as read

### Notification Types Supported

Based on the provided structure:
- `doctor_signup` - New doctor registration
- `appointment_scheduled` - Appointment created
- `appointment_cancelled` - Appointment cancelled
- `appointment_rescheduled` - Appointment rescheduled
- `appointment_pending` - Appointment pending
- `patient_registered` - New patient signup

### Socket.IO Events

**Client Side**:
```typescript
socket.emit('joinNotifications', userId);  // Listen for notifications
socket.emit('joinAlerts');                  // Listen for alerts
```

**Server Side**:
```javascript
io.to(`notification_${userId}`).emit('notification_new', notification);
```

## Testing the Setup

### 1. Verify NextAuth is Working
```bash
# Visit this URL to see NextAuth routes
http://admin.docmobidz.com/api/auth/signin
http://admin.docmobidz.com/api/auth/signout
http://admin.docmobidz.com/api/auth/session
```

### 2. Test Login Flow
1. Navigate to `/login`
2. Enter credentials: `admin@example.com` / `123456`
3. Should redirect to `/dashboard` with session

### 3. Test Notifications
1. Open `/dashboard` (logged in)
2. Check notification bell in top right
3. Verify unread count displays
4. Test mark as read functionality

### 4. Test Socket Connection
1. Open browser DevTools
2. Check Network tab for WebSocket connections
3. Should see `socket.io` connection to backend

## Rollback Plan

If you need to revert to the old authentication system:

1. **Revert API Client**
   - Switch back to using `/lib/api.ts` instead of `/lib/api-client.ts`
   - Remove all `api-client.ts` imports

2. **Revert Login Page**
   - Replace `signIn()` with manual `authAPI.login()`
   - Add localStorage token storage back

3. **Remove NextAuth**
   - Delete `/app/auth` directory
   - Delete `/types/next-auth.d.ts`
   - Remove SessionProvider from providers.tsx
   - Remove NextAuth from package.json

4. **Revert Middleware**
   - Update `/proxy.ts` to check localStorage instead of JWT

## Performance Improvements

### Before
- All API requests need to read localStorage
- XSS vulnerability from localStorage tokens
- No automatic token refresh on expiration

### After
- Tokens in httpOnly cookies (more secure)
- Automatic token refresh via NextAuth
- Sessions cached at request level
- WebSocket for real-time updates (no polling)

## Security Improvements

### Token Storage
- **Before**: localStorage (XSS vulnerable)
- **After**: httpOnly cookies (XSS protected)

### CSRF Protection
- NextAuth includes built-in CSRF tokens
- Protected by `NEXTAUTH_SECRET`

### Token Expiration
- **Before**: Manual refresh logic
- **After**: Automatic refresh via NextAuth callbacks

## Support

For more detailed information, see:
- `/NEXTAUTH_SETUP.md` - NextAuth configuration guide
- `/app/auth/[...nextauth]/route.ts` - Auth configuration
- `/lib/api-client.ts` - API client implementation
- `/hooks/use-socket.ts` - Socket.IO integration
