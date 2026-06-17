# Task 2-A: TikTok Shop Affiliate API Integration

**Agent**: full-stack-developer
**Wave**: 1 (parallel with Lazada 2-B agent)
**Status**: ✅ Complete
**Lint**: PASS (0 errors)
**TypeScript**: PASS (0 errors in my files)

## Files Created (8)

### Library (3)
- `src/lib/tiktok/mock-data.ts` — 45 Malaysian TikTok Shop products across 9 categories. TikTokMockService class with same method surface as real API client. Singleton `getTikTokMockService()`.
- `src/lib/tiktok/api-client.ts` — Real TikTok Shop API client. HMAC-SHA256 signing, OAuth helpers (`buildTikTokOAuthUrl`, `exchangeTikTokCodeForToken`), 9 endpoint methods, snake→camel normalizers.
- `src/lib/tiktok/affiliate-service.ts` — `TikTokAffiliateService` orchestrator. Auto-switches real/mock based on env var `TIKTOK_APP_KEY` presence or DB-stored credentials. Factory: `getTikTokService`, `getTikTokServiceFromEnv`, `getTikTokServiceFromDB`.

### API Routes (4 routes, 6 handlers)
- `src/app/api/tiktok/products/route.ts` — GET (search with q/category/page/limit/sort/minPrice/maxPrice)
- `src/app/api/tiktok/generate-link/route.ts` — POST (Zod-validated, persists to AffiliateLink)
- `src/app/api/tiktok/commissions/route.ts` — GET (orders + summary in parallel)
- `src/app/api/tiktok/connect/route.ts` — POST (save+test), GET (status), DELETE (purge)

### UI Page (1)
- `src/components/pages/tiktok-page.tsx` — Standalone 'use client' page. TanStack Query, ConnectionCard, EarningsSummaryCard, search/filter, 5-col vertical TikTok card grid with Play icon + Viral flame badge + bottom-left sales counter.

## Mock Product Count: **45** (exceeds 40+ requirement)

All 5 required example products included verbatim:
- Garnier Bright Complete Vitamin C Serum 30ml — RM 32.90, 12% commission
- Uniqlo Airism Mask 3pcs — RM 49.90, 8% commission
- Xiaomi Redmi Buds 4 Active — RM 99.00, 6% commission
- Philips Air Fryer HD9200 4.1L — RM 299.00, 5% commission
- Maggi Cup Curry Flavour 4x70g — RM 9.90, 15% commission

Plus 40 more across: Beauty×10, Fashion×8, Electronics×8, Home×7, Food×5, Health×3, Kids×2, Sports×2, Automotive×2.

## API Endpoints (6 handlers, 4 routes)
1. `GET  /api/tiktok/products`
2. `POST /api/tiktok/generate-link`
3. `GET  /api/tiktok/commissions`
4. `POST /api/tiktok/connect`     (save+test credentials)
5. `GET  /api/tiktok/connect`     (read connection status)
6. `DELETE /api/tiktok/connect`   (purge credentials)

All responses include `source: 'api' | 'mock'` field as required.

## Integration Hooks for Main Agent

The following changes need to be made by the main agent after Wave 1 completes (I did NOT touch these protected files):

1. **PageId in Zustand store** (`src/store/app-store.ts`):
   ```ts
   export type PageId =
     | ... existing ...
     | 'tiktok'   // ← ADD THIS
   ```

2. **Sidebar nav item** (`src/components/layout/sidebar.tsx`):
   Add an entry with:
   - icon: `Music2` from lucide-react
   - label: "TikTok Shop"
   - pageId: `'tiktok'`

3. **Page registration** (`src/app/page.tsx`):
   ```tsx
   const TikTokPage = lazy(() => import('@/components/pages/tiktok-page').then(m => ({ default: m.TikTokPage })))
   // Map 'tiktok' → <TikTokPage /> in the page router switch
   ```

4. **(Optional) Prisma model**: The CHECKLIST mentions a `TikTokShopAccount` model (subtask 2.1.3) — currently I'm reusing the `AppSetting` table (mirrors the Shopee pattern), which works. If you want a dedicated model for richer OAuth token storage (refresh tokens, expiry tracking), you can add it later — my code will not need changes since `getTikTokServiceFromDB()` reads from `AppSetting`.

5. **(Optional) `platform` field on `AffiliateLink`**: The CHECKLIST mentions adding `platform: "shopee" | "tiktok" | "lazada"` (subtask 2.1.13). My `generate-link` route currently persists without a platform discriminator (the existing model doesn't have one). If you add the field to the Prisma schema, my route would benefit from a one-line addition to set `platform: 'tiktok'` on create.

## Key Decisions
- Mock mode is default. Real API is opt-in via `TIKTOK_APP_KEY` env var or DB-stored credentials.
- OAuth is a stub — POST `/api/tiktok/connect` accepts pasted credentials and tests them. The real OAuth dance helpers are exported from `api-client.ts` and ready to wire up but not yet invoked.
- UI uses shadcn orange (`bg-shopee text-white`) for TikTok-themed buttons per the task spec.
- TikTok-style cards use 4:5 portrait aspect ratio with centered Play icon + "Viral" flame badge for high-trend products.
- All API responses include `source: 'api' | 'mock'` field as required.
- All API routes wrapped in try/catch with `handleError(error)` from `@/lib/api-error`.
- Reuses existing `AffiliateLink` and `AppSetting` Prisma models — no schema changes needed.

## Lint Status
PASS — `bun run lint` exits 0 with 0 errors and 0 warnings.

## TypeScript Status
PASS — `bunx tsc --noEmit` shows 0 errors in any `/tiktok/` file or `tiktok-page.tsx` (verified via grep filter).
