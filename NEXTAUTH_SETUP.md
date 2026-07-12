# NextAuth.js Integration Guide

This dashboard now uses NextAuth.js v5 for authentication with next-auth credentials provider and real-time Socket.IO notifications.

## Environment Variables

Add these to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars

# Backend API
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Generate NEXTAUTH_SECRET

```bash
# Run this command to generate a secure secret
openssl rand -base64 32
```

## Key Files

### 1. `/app/auth/[...nextauth]/route.ts`
NextAuth configuration with Credentials provider that calls your backend login endpoint.

- Handles JWT token management
- Stores `accessToken` and `refreshToken` in JWT
- Provides these tokens via session

### 2. `/lib/api-client.ts`
Updated API client that uses NextAuth session for authentication.

- Uses `getSession()` to retrieve tokens
- Automatically adds Authorization header
- No longer uses localStorage

### 3. `/types/next-auth.d.ts`
TypeScript definitions for NextAuth session extending with custom fields.

- Adds `accessToken` and `refreshToken` to session
- Adds `id` field to user object

### 4. `/components/providers.tsx`
Updated providers with SessionProvider from next-auth/react.

```tsx
<SessionProvider>
  <QueryClientProvider>
    {children}
  </QueryClientProvider>
</SessionProvider>
```

### 5. `/proxy.ts`
Route protection middleware using NextAuth tokens.

- Checks JWT token from nextAuth
- Protects `/dashboard/*` routes
- Redirects to `/login` if unauthorized

## Authentication Flow

### Login Flow
1. User enters email and password on `/login`
2. NextAuth's `signIn()` is called with credentials
3. Backend login endpoint validates and returns tokens
4. NextAuth stores tokens in JWT session
5. Tokens available via `useSession()` hook
6. User redirected to `/dashboard`

### API Calls
1. Component calls `await getApiClient()`
2. API client retrieves session via `getSession()`
3. Extracts `accessToken` from session
4. Adds `Authorization: Bearer {token}` header
5. Makes request to backend

### Logout Flow
1. Click logout in sidebar
2. `signOut()` called with `callbackUrl: "/login"`
3. Session cleared
4. Redirected to login page

## Real-Time Notifications

### Socket.IO Integration
Notifications are fetched via REST API and updated in real-time with Socket.IO.

#### File: `/hooks/use-socket.ts`
- Connects to Socket.IO server
- Joins notification rooms for user
- Emits and listens for events

#### File: `/components/notifications-dropdown.tsx`
- Displays notification bell with unread count
- Uses TanStack Query to fetch notifications
- Socket.IO listener invalidates cache on new notifications
- Mark as read/unread functionality

### Socket Events

#### Emitted (from client)
```javascript
socket.emit('joinNotifications', userId);    // Join user's notification room
socket.emit('joinAlerts');                    // Join alerts room
```

#### Listened (from server)
```javascript
socket.on('notification_new', (notification) => {
  // Refetch notifications
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
});
```

## Notification API Endpoints

Your backend should provide these endpoints (already integrated):

```
// GET /notification?isRead=true|false&page=1&limit=20
GET /notification

// PATCH /notification/:id/read
PATCH /notification/{id}/read

// PATCH /notification/read-all
PATCH /notification/read-all
```

Response format:
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": {
    "items": [
      {
        "_id": "notification_id",
        "userId": "user_id",
        "fromUserId": "from_user_id",
        "type": "doctor_signup|appointment_scheduled|etc",
        "title": "Notification title",
        "content": "Notification message",
        "meta": {
          "doctorId": "...",
          "email": "...",
          "phone": "..."
        },
        "isRead": false,
        "createdAt": "2026-01-21T04:05:32.781Z",
        "updatedAt": "2026-01-21T04:05:32.781Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

## Using Session in Components

### Client Components
```tsx
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session } = useSession();
  
  return <div>{session?.user?.email}</div>;
}
```

### Server Components
```tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth/[...nextauth]/route';

export default async function MyPage() {
  const session = await getServerSession(authOptions);
  
  return <div>{session?.user?.email}</div>;
}
```

## Accessing Tokens

### In Client Components
```tsx
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session } = useSession();
  
  // Access tokens
  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;
  
  return <div>Token: {accessToken?.substring(0, 10)}...</div>;
}
```

### In API Client
Tokens are automatically attached to all API requests via the `getApiClient()` function in `/lib/api-client.ts`.

## Protected Routes

Routes are protected via `/proxy.ts`:

**Protected Routes** (require authentication):
- `/dashboard/*`
- `/dashboard/doctors`
- `/dashboard/patients`
- `/dashboard/appointments`
- `/dashboard/earnings`
- `/dashboard/categories`
- `/dashboard/settings`

**Public Routes**:
- `/login`
- `/forgot-password`
- `/verify-otp`
- `/reset-password`

## Troubleshooting

### Issue: "Session is undefined"
- Ensure component is wrapped in `<SessionProvider>`
- Use `'use client'` directive in component
- Wait for session to load with `status` check

### Issue: "Token not being sent"
- Verify `NEXTAUTH_URL` is set correctly
- Check `NEXTAUTH_SECRET` is >= 32 characters
- Ensure `getApiClient()` is awaited before use

### Issue: "Infinite redirect loop"
- Check proxy.ts configuration
- Ensure SessionProvider is in layout
- Verify callback URLs in NextAuth config

### Issue: "Socket connection fails"
- Check `NEXT_PUBLIC_SOCKET_URL` environment variable
- Verify backend Socket.IO server is running
- Check CORS settings in backend

## Migration from Previous Auth

Old files that are no longer needed:
- `/lib/api.ts` - Use `/lib/api-client.ts` instead
- localStorage tokens - Now managed by NextAuth

Token storage automatically moved from localStorage to NextAuth JWT session.
