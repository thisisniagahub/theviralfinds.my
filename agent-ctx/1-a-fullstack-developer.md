# Task 1-a — User Authentication (NextAuth.js v4)

**Agent:** full-stack-developer
**Task:** Implement User Authentication with NextAuth.js v4
**Status:** ✅ Complete
**Date:** 2025-06-16

## What was built

### Backend (API + Auth config)
- `src/lib/auth.ts` — NextAuth v4 config (PrismaAdapter, JWT strategy, CredentialsProvider, conditional Google/Facebook providers)
- `src/types/next-auth.d.ts` — Type augmentation for Session.user.id and role
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `src/app/api/auth/register/route.ts` — POST registration with bcrypt hashing
- `src/app/api/auth/me/route.ts` — GET current user + PATCH update profile
- `src/middleware.ts` — Protects all /api/* routes (except /api/auth/*, /api/seed, /api/shopee/webhook) with JWT validation

### Database
- `prisma/schema.prisma` — Added `Account`, `Session`, `VerificationToken` models; added `image`, `emailVerified`, `accounts`, `sessions` fields/relations to `User`

### Frontend (Zustand + page components)
- `src/store/app-store.ts` — Added auth state: `user`, `isAuthenticated`, `isLoadingAuth`, `authView`, plus actions `checkAuth`, `login`, `register`, `loginWithProvider`, `logout`
- `src/components/pages/login-page.tsx` — Malaysian-themed login (Shopee orange split-screen, demo credentials hint)
- `src/components/pages/register-page.tsx` — HERMES-purple registration page with benefits list
- `src/app/page.tsx` — Wrapped with SessionProvider; conditionally renders login/register page when not authenticated
- `src/components/layout/header.tsx` — User dropdown menu (avatar, name, role, sign out); Sign In button when unauthenticated
- `src/components/layout/sidebar.tsx` — User section now syncs with authenticated user
- `src/components/pages/settings-page.tsx` — New "Account & Authentication" card; Profile form pre-filled from auth user; Save calls PATCH /api/auth/me

### Environment
- `.env` — Added NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID/SECRET, FACEBOOK_CLIENT_ID/SECRET (OAuth vars empty for now)

## Demo credentials
- Email: `demo@theviralfindsmy.com`
- Password: `demo123`
- Auto-created on first login attempt if no users exist in DB

## How auth works
1. User lands on `/` → `AppContent` calls `checkAuth()` → fetches `/api/auth/me`
2. If unauthenticated → renders `AuthScreen` (login or register based on `authView` in Zustand)
3. User submits login form → Zustand `login()` calls `next-auth/react`'s `signIn('credentials', {redirect: false, ...})`
4. NextAuth's CredentialsProvider validates email/password via bcrypt against Prisma User table
5. JWT issued, stored in HttpOnly cookie
6. `checkAuth()` re-fetches `/api/auth/me` to populate user state
7. `AppContent` re-renders → shows dashboard

## Middleware behavior
- All `/api/*` requests pass through `src/middleware.ts`
- Public paths: `/api/auth/*`, `/api/seed`, `/api/shopee/webhook`
- For protected paths: validates NextAuth JWT via `getToken()`
- Returns `401 {error: "Authentication required", code: "UNAUTHENTICATED"}` if no token
- Forwards `x-user-id`, `x-user-email`, `x-user-role` headers to API routes

## Tested
- ✅ Demo login (auto-creates demo user)
- ✅ Register new user with bcrypt-hashed password
- ✅ Wrong password rejected with clear error
- ✅ Session cookie issued, `/api/auth/me` returns authenticated user
- ✅ Protected `/api/dashboard` returns 401 without session, 200 with session
- ✅ PATCH /api/auth/me updates name and shopeeAffId
- ✅ Signout clears session
- ✅ Lint passes (my code: 0 errors; 2 pre-existing errors in network-banner.tsx/use-network-status.ts are unrelated)

## Notes for downstream agents
- Use `useAppStore(state => state.user)` to access the authenticated user in any client component
- Use `useAppStore(state => state.isAuthenticated)` to check auth status
- Use `getServerSession(authOptions)` from `next-auth` in API routes to access the session server-side (import from `@/lib/auth`)
- The middleware auto-forwards `x-user-id`, `x-user-email`, `x-user-role` headers — API routes can read these via `request.headers.get('x-user-id')` for a lightweight auth check without calling getServerSession
- Google/Facebook OAuth providers will automatically appear once `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` env vars are populated and the dev server is restarted
- The middleware.ts filename triggers a deprecation warning in Next.js 16 (recommends `proxy.ts`) but works correctly — kept as middleware.ts per task spec

## Dependencies installed
- `@next-auth/prisma-adapter@1.0.7`
- `bcryptjs@3.0.3` (with `@types/bcryptjs@3.0.0`)
- `next-auth@4.24.13` (was already in package.json)
