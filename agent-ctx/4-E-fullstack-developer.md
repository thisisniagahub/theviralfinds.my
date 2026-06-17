# Task 4-E: Fasa 4.5 API as a Service

**Agent:** full-stack-developer
**Task ID:** 4-E
**Status:** ✅ COMPLETE
**Lint:** PASS (0 errors, 0 warnings)
**Server:** HTTP 200 on `/` and `/?view=apikeys`

## Files Created (8 new) / Overwritten (1)

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `src/lib/apikeys/types.ts` | NEW | ~250 | 12 type definitions + `ALL_PERMISSIONS` array |
| `src/lib/apikeys/endpoints.ts` | NEW | ~330 | 16 documented endpoints across 8 categories |
| `src/lib/apikeys/mock-data.ts` | NEW | ~310 | 5 keys + deterministic 30-day timeseries + aggregations |
| `src/lib/apikeys/store.ts` | NEW | ~30 | Shared in-memory store (avoids cross-route sync issues) |
| `src/app/api/apikeys/route.ts` | NEW | ~190 | GET list + POST mint (Web Crypto key generation) |
| `src/app/api/apikeys/[id]/route.ts` | NEW | ~190 | GET detail + PATCH update + DELETE revoke |
| `src/app/api/apikeys/usage/route.ts` | NEW | ~40 | GET aggregated 30-day analytics |
| `src/app/api/apikeys/playground/route.ts` | NEW | ~170 | POST mock-request executor with latency simulation |
| `src/components/pages/apikeys-page.tsx` | OVERWRITTEN | ~2150 | Was 6-line stub; now full 4-tab dashboard |

## Endpoints Documented (16 total)

| Category | Method | Path | Permission |
|----------|--------|------|------------|
| Products | GET | /api/v1/products | products:read |
| Products | GET | /api/v1/products/:id | products:read |
| Products | GET | /api/v1/products/search | products:read |
| Links | POST | /api/v1/links | links:write |
| Links | GET | /api/v1/links | links:read |
| Links | DELETE | /api/v1/links/:id | links:write |
| Earnings | GET | /api/v1/earnings | earnings:read |
| Analytics | GET | /api/v1/analytics | analytics:read |
| Analytics | GET | /api/v1/audience | audience:read |
| Content | POST | /api/v1/content/generate | content:write |
| Trends | GET | /api/v1/trends | trends:read |
| Trends | GET | /api/v1/trends/competitors | trends:read |
| Alerts | POST | /api/v1/alerts/preferences | alerts:write |
| Alerts | GET | /api/v1/alerts | alerts:read |
| Auth | GET | /api/v1/auth/introspect | (none) |
| Auth | DELETE | /api/v1/auth/keys/:id | (none) |

## API Routes Created (4 routes, 7 handlers)

1. `GET /api/apikeys` — list all keys (masked, no plaintext)
2. `POST /api/apikeys` — mint new key (returns plaintext ONCE)
3. `GET /api/apikeys/[id]` — key detail
4. `PATCH /api/apikeys/[id]` — update name/permissions/rateLimit
5. `DELETE /api/apikeys/[id]` — soft-revoke (status='revoked')
6. `GET /api/apikeys/usage` — aggregated 30-day analytics
7. `POST /api/apikeys/playground` — mock-request executor

All responses include `source: 'mock'` field per spec.

## UI Tabs

- **API Keys**: Table + Generate Dialog (name/permissions/rateLimit) + One-Time Key Reveal Dialog + Edit Dialog + Revoke Confirmation
- **Documentation**: Sticky sidebar (search + grouped by category) + main detail panel with params table, curl example, JSON response example (with syntax highlighting), error responses
- **Playground**: 2-col grid (Request | Response) with method selector, path autocomplete, parameter editor, JSON body editor, headers display, response with status/latency/body/headers
- **Analytics**: 4 Recharts charts (AreaChart, BarChart, LineChart, BarChart) + Top endpoints Table + Per-key usage Table

## Mock API Keys (5)

1. Production App — `tvf_prod_a3f2k8m9x2...` — all permissions — 10k/day — ~142,580 calls/30d
2. Analytics Dashboard — `tvf_ana_b7c3d1e8f5...` — read-only — 1k/day — ~28,450 calls/30d
3. Mobile App Backend — `tvf_mob_h2i9j4k7l3...` — products+links — 10k/day — ~89,320 calls/30d
4. Testing Key — `tvf_test_z1y2x3w4v5...` — all permissions — 100/day — ~1,240 calls/30d
5. Legacy Webhook (Revoked) — `tvf_whk_q5w6e7r8t9...` — read-only — 100/day — 0 calls (revoked)

## Color System (NO blue/indigo)

- GET = emerald
- POST = shopee orange
- PUT = amber
- PATCH = purple
- DELETE = rose
- Status: active=emerald, revoked=rose, expired=amber
- Primary actions: shopee orange background
- Required-permission badges: purple (hermes-adjacent)

## Key Decisions

1. **Shared store** (`store.ts`): Extracted `keyStore` + `plaintextRegistry` + `findKey()` to avoid the cross-route sync issue where a freshly-minted key would 404 on PATCH/DELETE.
2. **Web Crypto key generation**: Uses `crypto.getRandomValues` (Node 18+) for 16 random hex chars; env prefix (test/ana/prod) derived from rate-limit tier.
3. **Plaintext security**: Returned EXACTLY ONCE in POST response; stored only for playground header echo; NEVER returned by GET.
4. **Deterministic mock data**: mulberry32 PRNG seeded by `hashString(keyId)` so charts look consistent across reloads within a dev-server lifetime. Weekly seasonality + slow upward trend.
5. **EditKeyDialog remount pattern**: Replaced `useEffect`-based state sync (flagged by `react-hooks/set-state-in-effect`) with `key={editKey.id}` prop + non-nullable prop type + lazy `useState` initializers.
6. **Lightweight JSON syntax highlighter**: Custom regex-based `JsonBlock` — no external dep (avoids `react-syntax-highlighter` bundle bloat).
7. **Latency simulation**: Tiered by `rateLimitCost` (120ms for GETs, 1850ms for AI calls) + 0-80ms jitter; 5% chance of 503 AI_UNAVAILABLE for content-generate.
8. **No shared files modified**: Skipped Prisma `ApiKey` model (CHECKLIST 4.5.1) per "DO NOT modify shared files" constraint; in-memory store is the production swap target.

## Verification

- ✅ `bun run lint` — PASS (0 errors, 0 warnings)
- ✅ `curl http://localhost:3000/` — HTTP 200
- ✅ `curl http://localhost:3000/?view=apikeys` — HTTP 200 (page renders, ~25-30ms)
- ✅ All 7 API handlers return proper JSON with `source: 'mock'` field (auth-protected, matching alerts pattern)
