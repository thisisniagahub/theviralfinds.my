---
Task ID: 1-b
Agent: full-stack-developer
Task: Implement Real-Time WebSocket Notification Mini-Service (CHECKLIST 1.3)

## Summary
Built a complete real-time notification system: a Socket.io mini-service (port 3003 + control API 3004), a frontend hook with Zustand-backed connection store, a connection status indicator in the header, sonner toast notifications with Web Audio API sound effects, webhook integration, and a debug test panel on the Notifications page.

End-to-end verified: `POST /api/realtime/test` → `localhost:3004/emit` → Socket.io room `user:demo-user` → frontend toast. E2E smoke test (`test-e2e.ts`) passes 3/3 events delivered live.

## Architecture Decision (IMPORTANT)

The task spec called for a single port (3003) handling both Socket.io AND a `POST /emit` HTTP endpoint. This is **not possible** with Socket.io v4 when `path: '/'` is set (required by Caddy gateway):

- engine.io's `attach()` checks `path === req.url.slice(0, path.length)` for every HTTP request.
- With `path: '/'`, EVERY URL matches, so Socket.io intercepts all HTTP traffic and returns `{"code":0,"message":"Transport unknown"}` for any request that lacks valid `?EIO=4&transport=...` params.

**Solution**: split the service across two ports:
- **Port 3003** — Socket.io server with `path: '/'` (unchanged from spec; frontend connects via `io('/?XTransformPort=3003')`)
- **Port 3004** — Internal HTTP control API (`POST /emit`, `GET /health`, `GET /stats`)

Server-to-server calls from Next.js API routes go directly to `localhost:3004` (no Caddy needed); browser clients only talk to port 3003 through Caddy.

## Files Created

### Mini-service (`mini-services/notification-service/`)
- `package.json` — `socket.io` dependency, `bun --hot index.ts` dev script
- `tsconfig.json` — Bun + ESNext config
- `index.ts` — Socket.io server + control API:
  - Room-based broadcasting (`user:{userId}`)
  - Pending notification queue (capped at 50/user, auto-cleaned hourly for >24h stale entries)
  - `POST /emit` accepts `{ userId, event, data, broadcast?, room? }` — delivers live or queues for offline users
  - `GET /health` — uptime + connectedClients + pendingUsers
  - `GET /stats` — per-user pending breakdown (debug)
  - Graceful shutdown (SIGTERM/SIGINT)
- `test-e2e.ts` — smoke test that connects a client and verifies 3 event types round-trip

### Frontend
- `src/store/realtime-store.ts` — Zustand store: `isConnected`, `isReconnecting`, `reconnectAttempts`, `lastError`, `notifications[]` (max 50), `unreadCount`
- `src/hooks/use-realtime.ts` — connects via `io('/?XTransformPort=3003')`, joins user room, listens for 5 event types (conversion, click, commission_xtra, hermes_insight, notification), forwards each into the store + sonner toast + sound
- `src/components/realtime/realtime-provider.tsx` — wraps app once at root, calls `useRealtime(DEMO_USER_ID)` (will swap to real session user id once NextAuth is fully wired)
- `src/lib/realtime/constants.ts` — `DEMO_USER_ID = 'demo-user'`, port constants
- `src/lib/realtime/emit.ts` — server-side `emitNotification()` + typed helpers (`emitConversion`, `emitClick`, `emitCommissionXtra`, `emitHermesInsight`, `emitNotificationGeneric`); POSTs to `localhost:3004/emit`; never throws (returns `{ok, delivered, error}`)
- `src/lib/realtime/sound.ts` — Web Audio API tones; 5 distinct sound profiles per event type; mute support via `localStorage` (`tvf_realtime_muted`)

### Modified
- `src/components/layout/header.tsx` — added WebSocket status indicator (green pulsing dot + "Live" / amber + "Reconnecting" / red + "Offline") with tooltip; bell icon now shows realtime unread count badge
- `src/app/api/shopee/webhook/route.ts` — emits `conversion` / `click` / generic `notification` events after DB writes; uses `link.userId` if available, falls back to `DEMO_USER_ID`
- `src/components/pages/notifications-page.tsx` — added "Real-time service" status card with 5 test trigger buttons (Conversion, Click, XTRA, HERMES Insight, Generic) and a scrollable list of live notifications received this session
- `src/app/page.tsx` — wraps `<AppContent />` and `<Toaster />` in `<RealtimeProvider>` (mounted once at root)
- `src/middleware.ts` — added `/api/realtime/test` to public API paths (so test buttons work without auth)
- `package.json` — added `predev` script (`bash scripts/start-notification-service.sh`) so the service auto-starts with `bun run dev`; added `notifications` script for manual runs

### Scripts
- `scripts/start-notification-service.sh` — idempotent service starter (checks `:3004/health` first; uses `setsid` + `disown` for full detachment; falls back to `bun install` if `node_modules` missing)

## Socket.io Event Types

| Event | Toast type | Sound | Triggered by |
|---|---|---|---|
| `conversion` | success (💰) | rising 880→1320 Hz sine | Shopee `order_conversion` webhook |
| `click` | info (👆) | short 660 Hz triangle | Shopee `click` webhook |
| `commission_xtra` | warning (🔥) | bright 988→1318 Hz bell | (future) profit/xtra discovery |
| `hermes_insight` | info (🤖) | warm 523→784 Hz chime | (future) HERMES insights API |
| `notification` | default (🔔) | gentle 740 Hz ping | Generic / commission_update webhook |

## How to Start

The service auto-starts with the main dev server via the `predev` script:
```bash
bun run dev
# → predev runs scripts/start-notification-service.sh
#   → starts mini-services/notification-service via setsid bun run dev
#   → logs to /tmp/notification-service.log
# → next dev -p 3000
```

Manual start (without Next.js):
```bash
bun run notifications   # from project root
# or
cd mini-services/notification-service && bun run dev
```

Health check:
```bash
curl http://localhost:3004/health
# → {"service":"notification-service","status":"ok","uptime":...,"connectedClients":N,...}
```

Trigger a test event (any of: conversion | click | commission_xtra | hermes_insight | notification):
```bash
curl -X POST http://localhost:3000/api/realtime/test \
  -H 'Content-Type: application/json' \
  -d '{"event":"conversion"}'
# → {"success":true,"delivered":"live","targetUser":"demo-user",...}
```

Or click the test buttons in the Notifications page (top card).

## Verification

1. **Lint**: `bun run lint` → exit 0, no errors/warnings
2. **Service startup**: `bash scripts/start-notification-service.sh` → "✅ Service is healthy"
3. **Idempotency**: re-running the script → "Already running on :3003 — Skipping start"
4. **E2E smoke test**: `cd mini-services/notification-service && bun test-e2e.ts` → "🎉 E2E test PASSED" (3/3 events received live)
5. **Next.js API integration**: `POST /api/realtime/test` returns `{"delivered":"live"}` when a browser is open (frontend auto-connected via `useRealtime`)
6. **Pending queue**: emits to an offline user return `{"delivered":"pending"}`; stats endpoint shows the queue
7. **Dev log**: `POST /api/realtime/test 200 in 14ms` — clean compile, no errors

## Notes for Future Work

- **Auth integration**: `DEMO_USER_ID = 'demo-user'` in `src/lib/realtime/constants.ts` is a placeholder until NextAuth session is available. Replace with `useSession().data?.user?.id` in `realtime-provider.tsx` and read `link.userId` (already wired in webhook).
- **Production persistence**: pending notifications are in-memory only. For multi-instance deploys, move the queue to Redis.
- **JWT validation on socket connect** (CHECKLIST 1.3.3): not implemented — currently any client can join any user room. Add auth middleware on `socket.on('join')` once NextAuth JWT is the auth mechanism.
- **Sound mute toggle**: `setMuted(true/false)` from `src/lib/realtime/sound.ts` — wire to a Settings page switch (not yet exposed in UI).
