# Quick Reference Guide

## Environment Setup (5 minutes)

```bash
# 1. Generate secret
openssl rand -base64 32

# 2. Create .env.local with:
NEXTAUTH_URL=http://admin.docmobidz.com
NEXTAUTH_SECRET=<paste-generated-secret>
NEXT_PUBLIC_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# 3. Install & Run
npm install
npm run dev

# 4. Open http://admin.docmobidz.com/login
# Login: admin@example.com / 123456
```

## Common Code Snippets

### Access Session in Component

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session } = useSession();
  
  console.log(session?.user?.email);        // User email
  console.log(session?.accessToken);        // API token
  console.log(session?.refreshToken);       // Refresh token
  
  return <div>{session?.user?.name}</div>;
}
```

### Make API Call

```typescript
import { doctorsAPI } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['doctors', page],
  queryFn: () => doctorsAPI.getDoctors(page, 10),
});
```

### Use Notifications

```typescript
import { useSocket } from '@/hooks/use-socket';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '@/lib/api-client';

const { socket } = useSocket();
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: () => notificationsAPI.getNotifications(),
});
```

### Sign Out

```typescript
import { signOut } from 'next-auth/react';

const handleLogout = async () => {
  await signOut({ callbackUrl: '/login' });
};
```

### Handle Errors

```typescript
import { toast } from 'sonner';

try {
  const response = await doctorsAPI.getDoctors();
} catch (error: any) {
  toast.error(error.response?.data?.message || 'Error occurred');
}
```

## File Locations

| Purpose | File |
|---------|------|
| NextAuth Config | `/app/auth/[...nextauth]/route.ts` |
| API Client | `/lib/api-client.ts` |
| Socket Hook | `/hooks/use-socket.ts` |
| Notifications | `/components/notifications-dropdown.tsx` |
| Dashboard Pages | `/app/dashboard/*/page.tsx` |
| TypeScript Types | `/types/next-auth.d.ts` |
| Route Protection | `/proxy.ts` |
| Global Styles | `/app/globals.css` |

## API Endpoints Quick Reference

```javascript
// Auth
authAPI.login(email, password)
authAPI.forgotPassword(email)
authAPI.verifyOTP(email, otp)
authAPI.resetPassword(email, otp, password)
authAPI.changePassword(oldPassword, newPassword)

// Notifications
notificationsAPI.getNotifications(page, limit, isRead)
notificationsAPI.markAsRead(notificationId)
notificationsAPI.markAllAsRead()

// Doctors
doctorsAPI.getDoctors(page, limit, search, status)
doctorsAPI.getDoctorById(id)
doctorsAPI.approveDoctorRegistration(id, status)
doctorsAPI.updateDoctor(id, data)
doctorsAPI.deleteDoctor(id)

// Patients
patientsAPI.getPatients(page, limit, search, status)
patientsAPI.getPatientById(id)
patientsAPI.updatePatient(id, data)
patientsAPI.deletePatient(id)

// Appointments
appointmentsAPI.getAppointments(page, limit, search, status)
appointmentsAPI.getAppointmentById(id)
appointmentsAPI.updateAppointment(id, data)
appointmentsAPI.cancelAppointment(id)

// Categories
categoriesAPI.getCategories(page, limit, search)
categoriesAPI.getCategoryById(id)
categoriesAPI.createCategory(data)
categoriesAPI.updateCategory(id, data)
categoriesAPI.deleteCategory(id)

// Earnings
earningsAPI.getDoctorEarnings(page, limit)
earningsAPI.getEarningsOverview()

// Dashboard
dashboardAPI.getOverview()
```

## Database Schema Expected

### Users Table
```sql
CREATE TABLE users (
  _id ObjectId,
  email String (unique),
  password String (hashed),
  firstName String,
  lastName String,
  role String ('admin', 'doctor', 'patient'),
  profileImage String,
  createdAt Date
)
```

### Doctors Table
```sql
CREATE TABLE doctors (
  _id ObjectId,
  userId ObjectId (ref: users),
  specialty String,
  approvalStatus String ('pending', 'approved', 'rejected'),
  appointmentCount Number,
  earnings Number,
  createdAt Date
)
```

### Patients Table
```sql
CREATE TABLE patients (
  _id ObjectId,
  userId ObjectId (ref: users),
  status String ('active', 'block'),
  appointmentCount Number,
  createdAt Date
)
```

### Appointments Table
```sql
CREATE TABLE appointments (
  _id ObjectId,
  patientId ObjectId (ref: patients),
  doctorId ObjectId (ref: doctors),
  status String ('scheduled', 'completed', 'cancelled', 'rescheduled'),
  date Date,
  time String,
  fees Number,
  createdAt Date
)
```

### Categories Table
```sql
CREATE TABLE categories (
  _id ObjectId,
  name String,
  image String,
  status Boolean,
  createdAt Date
)
```

### Notifications Table
```sql
CREATE TABLE notifications (
  _id ObjectId,
  userId ObjectId (ref: users),
  fromUserId ObjectId (ref: users),
  type String,
  title String,
  content String,
  meta Object,
  isRead Boolean,
  createdAt Date
)
```

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Session is undefined` | Add 'use client' directive and wrap with SessionProvider |
| `Cannot read property 'accessToken'` | Use `await getApiClient()` before API calls |
| `Socket connection fails` | Verify NEXT_PUBLIC_SOCKET_URL and backend Socket.IO |
| `401 Unauthorized` | Token expired - login again or check backend auth |
| `CORS error` | Configure CORS on backend to allow requests |
| `Chunk error` | Clear .next folder and rebuild: `rm -rf .next && npm run build` |
| `Module not found` | Check import path and file exists |
| `useSearchParams error` | Wrap in Suspense boundary or use `'use client'` |

## Browser Console Commands

```javascript
// Check session
const session = await fetch('/api/auth/session').then(r => r.json());
console.log(session);

// Check Socket.IO connection
console.log(io.engine.connected);

// Test API call
fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: '123456' })
}).then(r => r.json()).then(console.log);
```

## Git Workflow

```bash
# Before starting work
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of change"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Deployment Steps

### Vercel
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys, or:
vercel deploy --prod

# Add env vars in Vercel dashboard
```

### Other Platforms
```bash
# Build
npm run build

# Deploy output in .next folder
# Set environment variables
# Start: node .next/standalone/server.js
```

## Performance Tips

1. **Images**: Use `<Image>` from `next/image` for optimization
2. **Fonts**: Already optimized with next/font
3. **Bundle**: Check with `npm run build`
4. **Caching**: 5-minute stale time configured in React Query
5. **Rendering**: Use Suspense for slow components

## Security Checklist

- [ ] NEXTAUTH_SECRET is secret (not committed)
- [ ] API keys not exposed in client code
- [ ] No hardcoded credentials
- [ ] HTTPS in production
- [ ] CORS configured properly
- [ ] Rate limiting on backend
- [ ] Input validation on both ends

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Production build
npm run lint             # Check for errors
npm run format           # Format code

# Testing
npm run test             # Run tests (if configured)

# Database
npm run db:migrate       # Run migrations (if using)

# Cleanup
npm run clean            # Clear .next folder
rm -rf node_modules      # Reinstall dependencies
```

## Documentation Files

- `NEXTAUTH_SETUP.md` - Detailed NextAuth configuration
- `MIGRATION_GUIDE.md` - Changes from old auth system
- `IMPLEMENTATION_SUMMARY.md` - Complete feature overview
- `SETUP_CHECKLIST.md` - Step-by-step setup verification
- `README.md` - Project overview
- `QUICK_REFERENCE.md` - This file

## Next Auth Docs
- **Official Docs**: https://authjs.dev
- **Next.js Auth**: https://nextjs.org/docs/app/building-your-application/authentication
- **Socket.IO Docs**: https://socket.io/docs

## Key Links

| Resource | URL |
|----------|-----|
| Next.js Docs | https://nextjs.org/docs |
| React Docs | https://react.dev |
| TypeScript | https://typescriptlang.org |
| Tailwind CSS | https://tailwindcss.com |
| shadcn/ui | https://ui.shadcn.com |
| TanStack Query | https://tanstack.com/query |
| NextAuth Docs | https://authjs.dev |

---

**Remember**: When in doubt, check the documentation files first!
