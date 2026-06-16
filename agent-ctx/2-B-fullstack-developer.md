# Task 2-B: Fasa 2.2 Lazada Affiliate Integration

**Agent:** full-stack-developer
**Task:** Lazada Affiliate Integration (10 subtasks) for TheViralFindsMY

## Scope
Build complete Lazada affiliate integration following Shopee pattern (dual data source: mock mode fallback). Malaysian market focused (RM currency, Manglish/Bahasa content).

## Files to CREATE (only new files — do NOT modify shared files)
1. `src/lib/lazada/api-client.ts` — Lazada Open Platform REST client with HMAC-MD5 signing
2. `src/lib/lazada/mock-data.ts` — 40+ realistic Malaysian Lazada products + LazadaMockService
3. `src/lib/lazada/affiliate-service.ts` — LazadaAffiliateService class (auto-switches real/mock based on env var)
4. `src/app/api/lazada/products/route.ts` — GET handler
5. `src/app/api/lazada/generate-link/route.ts` — POST handler
6. `src/app/api/lazada/commissions/route.ts` — GET handler
7. `src/app/api/lazada/connect/route.ts` — POST/DELETE OAuth stub
8. `src/components/pages/lazada-page.tsx` — Full Lazada page with search, grid, link generation

## Key Decisions
- **Mock mode enabled by default** (no real Lazada API credentials in dev env)
- **HMAC-MD5 signing** used (Lazada Open Platform spec) — even though MD5 is legacy, this matches Lazada's official SDK
- **Reuses existing `--shopee` orange theme** for brand consistency (as instructed)
- **TanStack Query** for client data fetching
- **All API responses include `source: 'mock' | 'api'`** field

## Integration Hooks for Main Agent
- Needs PageId `'lazada'` added to `src/store/app-store.ts`
- Needs sidebar nav item added to `src/components/layout/sidebar.tsx`
- Needs page registration in `src/app/page.tsx` (lazy import + pageComponents map entry)
- Needs `LazadaAccount` Prisma model in `prisma/schema.prisma` (fields: appKey, appSecret, region, accessToken, refreshToken, expiresAt, status)
- The lazada-page is currently standalone — when integrated into the main app router, it can be rendered at the `lazada` PageId

## Work Log
- Read worklog.md, CHECKLIST.md lines 197-213 (Section 2.2), shopee/affiliate-api.ts, shopee/mock-data.ts, products-page.tsx, app-store.ts to understand patterns
- Read existing shopee API routes (products, generate-link, connect, commissions) for structure
- Read api-error.ts, validation.ts, rate-limit-enforce.ts for shared utilities
- Confirmed shadcn UI components available (Card, Input, Button, Badge, Tabs, Skeleton, Select, Separator, Toaster via sonner)
- Confirmed `--shopee` orange color theme in globals.css (will reuse for brand consistency)
- (in progress) Creating all 8 files

## Completion Status
- All 8 files created successfully
- `bun run lint` → 0 errors, 0 warnings
- `bunx tsc --noEmit --skipLibCheck` → 0 errors in lazada files
- Dev server stable on port 3000
- 42 mock Malaysian Lazada products across 6 categories
- Worklog appended to /home/z/my-project/worklog.md

## Files Created
1. `/home/z/my-project/src/lib/lazada/api-client.ts` — Lazada Open Platform REST client (HMAC-MD5 signing + OAuth helpers + all affiliate endpoints)
2. `/home/z/my-project/src/lib/lazada/mock-data.ts` — 42 Malaysian Lazada products + LazadaMockService class
3. `/home/z/my-project/src/lib/lazada/affiliate-service.ts` — LazadaAffiliateService with auto-switch (real/mock) + 3 factory functions
4. `/home/z/my-project/src/app/api/lazada/products/route.ts` — GET search handler
5. `/home/z/my-project/src/app/api/lazada/generate-link/route.ts` — POST generate-link handler
6. `/home/z/my-project/src/app/api/lazada/commissions/route.ts` — GET commissions handler
7. `/home/z/my-project/src/app/api/lazada/connect/route.ts` — POST/DELETE/GET OAuth connect/disconnect/status
8. `/home/z/my-project/src/components/pages/lazada-page.tsx` — Full TanStack Query-driven page

## Integration Hooks for Main Agent
- Add `PageId = 'lazada'` to `src/store/app-store.ts`
- Add Lazada nav item to `src/components/layout/sidebar.tsx`
- Register `LazadaPage` in `src/app/page.tsx` page map
- (Optional) Create `LazadaAccount` Prisma model — current AppSetting key-value approach works without it
