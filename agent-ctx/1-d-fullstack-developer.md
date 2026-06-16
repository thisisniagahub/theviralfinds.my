# Task 1-d — Error Handling & Edge Case Hardening

## Summary
Harden the TheViralFindsMY app against all error scenarios: API validation, rate limiting, network failures, render crashes, and empty data states. Built a comprehensive error-handling infrastructure that's now applied across 14 API routes and the root page component.

## Files Created (13)
| Path | Purpose |
|------|---------|
| `src/lib/api-error.ts` | `ApiError` class, `handleError()` (handles ApiError/ZodError/SyntaxError/Prisma), `apiHandler()` wrapper, `parseJsonBody()` |
| `src/lib/rate-limit.ts` | In-memory rate limiter with sliding window, IP detection, `RATE_LIMITS` presets (read/write/ai/webhook) |
| `src/lib/rate-limit-enforce.ts` | `enforceRateLimit()` returns 429 NextResponse with Retry-After + X-RateLimit-* headers |
| `src/lib/validation.ts` | `validateBody()`, `validateQuery()`, and 14 pre-built Zod schemas for every POST endpoint |
| `src/lib/fetch-utils.ts` | Browser `apiFetch<T>()` with auto toast on errors; `apiGet/apiPost/apiPatch/apiDelete` helpers |
| `src/hooks/use-network-status.ts` | `useNetworkStatus()` tracks online/offline + emits toasts; `useRetryConnection()` pings /api/health |
| `src/components/error-boundary.tsx` | React class boundary with friendly fallback UI + Try Again/Reload buttons |
| `src/components/network-banner.tsx` | Sticky amber banner when offline, with Retry + Dismiss |
| `src/components/ui/empty-state.tsx` | `EmptyState` (icon + title + description + action, compact variant) |
| `src/components/ui/inline-skeleton.tsx` | 8 skeleton presets: StatCard, StatGrid, Table, List, CardGrid, Chart, Page |
| `src/app/api/health/route.ts` | Lightweight health check with DB ping |
| `src/app/api/[...catchAll]/route.ts` | JSON 404 for unknown /api/* paths (all HTTP methods) |
| `src/app/error.tsx` | Next.js root error boundary with collapsible details |

## Files Modified (16)
- `src/app/page.tsx` — wrapped page in `<ErrorBoundary>`, added `<NetworkBanner>`, swapped PageLoader to `<PageSkeleton />`
- `src/middleware.ts` — added `/api/health` to public paths
- 14 API routes — added Zod validation + rate limiting + `handleError`:
  - `/api/links` (GET, POST)
  - `/api/notifications` (GET, PATCH)
  - `/api/campaigns` (GET, POST)
  - `/api/autopost` (GET, POST) + `/api/autopost/[id]` (PATCH, DELETE)
  - `/api/shopee/products` (GET), `/api/shopee/generate-link` (POST), `/api/shopee/connect` (POST), `/api/shopee/webhook` (POST)
  - `/api/hermes/chat` (POST), `/api/hermes/connection` (POST), `/api/hermes/skills` (POST), `/api/hermes/tasks` (POST), `/api/hermes/memory` (DELETE)
  - `/api/content/generate` (POST), `/api/content/library` (GET, POST, PATCH, DELETE)
  - `/api/profit/score` (POST), `/api/profit/calculator` (POST)
  - `/api/studio/script` (POST), `/api/studio/tts` (POST), `/api/studio/caption` (POST)

## Error Scenarios Handled
| Scenario | Status | Response |
|----------|--------|----------|
| Malformed JSON body | 400 | `{error: "Invalid JSON in request body"}` |
| Missing required field | 400 | `{error: "Validation failed", details: [{path, message}]}` |
| Invalid enum value | 400 | Same as above, lists allowed values |
| Invalid query params | 400 | Sane bounds enforced |
| Unknown API endpoint | 404 | `{error: "API endpoint not found"}` (JSON, not HTML) |
| Prisma unique constraint (P2002) | 409 | `{error: "A record with this value already exists"}` |
| Prisma record not found (P2025) | 404 | `{error: "Record not found"}` |
| Rate limit exceeded | 429 | `{error: "Too many requests"}` + Retry-After header |
| Webhook signature mismatch | 401 | `{error: "Invalid webhook signature"}` |
| Network offline (browser) | — | Top amber banner + toast + Retry button |
| React render error | — | ErrorBoundary card with Try Again/Reload |
| Catastrophic page error | — | Next.js `error.tsx` fallback |
| DB unreachable | 503 | `/api/health` returns `{status: "degraded"}` |

## Rate Limit Tiers
| Tier | Limit | Used by |
|------|-------|---------|
| `read` | 200/min | All GET endpoints |
| `write` | 60/min | POST/PATCH/DELETE mutations |
| `ai` | 20/min | AI generation endpoints (chat, content, script, tts, caption, score) |
| `webhook` | 500/min | Public webhook receivers |

## Lint Status
Pass (0 errors, 0 warnings)

## Dev Server Verification
- `/api/health` → 200 with `{status: "ok", db: "connected", latencyMs: 1}`
- `/api/shopee/webhook` POST with empty body → 400 `{error: "Shopee not configured"}` (was 500 before)
- All existing pages still render correctly (`/` returns 200)
