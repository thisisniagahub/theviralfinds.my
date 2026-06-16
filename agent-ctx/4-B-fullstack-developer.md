# Task ID 4-B — Affiliate Content Marketplace

**Agent:** full-stack-developer  
**Task:** Fasa 4.2 Affiliate Content Marketplace (10 subtasks)  
**Status:** ✅ COMPLETE

## Files Created/Overwritten (7)

| File | Type | Lines |
|---|---|---|
| `src/lib/marketplace/types.ts` | NEW | ~310 |
| `src/lib/marketplace/mock-data.ts` | NEW | ~1360 |
| `src/app/api/marketplace/listings/route.ts` | NEW | GET + POST |
| `src/app/api/marketplace/listings/[id]/route.ts` | NEW | GET + PATCH + DELETE |
| `src/app/api/marketplace/purchase/route.ts` | NEW | POST |
| `src/app/api/marketplace/seller/route.ts` | NEW | GET + POST |
| `src/components/pages/marketplace-page.tsx` | OVERWRITTEN (was stub) | ~1100 |

## Mock Data Counts

- **Listings:** 32 (across 6 categories × 5 niches × 4 platforms)
- **Sellers:** 9 (8 mock + 1 current user "You")
- **Reviews:** 12 (with Malaysian context + Manglish)

## API Endpoints (8 handlers)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/marketplace/listings` | Browse with filters (category, platform, niche, sort, q, price range) |
| POST | `/api/marketplace/listings` | Create new listing under current user |
| GET | `/api/marketplace/listings/[id]` | Listing detail + reviews + 4 related |
| PATCH | `/api/marketplace/listings/[id]` | Update owner's listing |
| DELETE | `/api/marketplace/listings/[id]` | Soft-delete owner's listing |
| POST | `/api/marketplace/purchase` | Purchase with 15% fee + download URL |
| GET | `/api/marketplace/seller` | Seller dashboard aggregate |
| POST | `/api/marketplace/seller` | Create/update seller profile |

All responses include `source: 'mock'`.

## Verification

- **Lint:** PASS (0 errors, 0 warnings, exit 0)
- **Server:** HTTP 200 on `/` (~15ms render)
- **End-to-end API tests:** All 8 handlers verified with auth session cookie
  - GET listings → 32 listings + 5 featured + 6 categories
  - GET detail → full listing + 12 reviews + related
  - GET seller dashboard → current-user profile + 6-month zero stats
  - POST purchase (lst-001, billplz) → success, RM 29.90 amount, RM 4.49 fee, RM 25.41 payout
  - POST create listing → success, listing created under "You" seller

## Key Decisions

- **Marketplace fee:** 15% per spec example (RM 29.90 × 0.15 = RM 4.49)
- **Shared in-memory store:** `userCreatedListings` Map lives in `mock-data.ts` so listings/[id] + seller routes see POST-created state across requests
- **Soft-delete:** DELETE sets isActive=false (not removed from store)
- **Watermarked preview:** Detail dialog overlays rotated "PREVIEW" text on image + badge on snippet box; full content locked until purchase
- **Color:** Emerald primary (no indigo/blue); platform badges color-coded per platform
- **Mock seed listings are immutable:** PATCH/DELETE return 403 for non-owner listings
- **Did NOT modify shared files:** No changes to middleware.ts, schema.prisma, sidebar, page.tsx, or other agents' lib files

## All 10 CHECKLIST 4.2 Subtasks ✅

- ✅ 4.2.1 MarketplaceListing model — type system + in-memory Map (ready to swap for Prisma)
- ✅ 4.2.2 Listing API routes — 5 handlers (GET/POST collection, GET/PATCH/DELETE [id])
- ✅ 4.2.3 Browsing UI — featured carousel + filter sidebar + grid + search + sort
- ✅ 4.2.4 Listing detail page — full dialog with preview + features + reviews + related + buy
- ✅ 4.2.5 Purchase flow — payment method selector + fee breakdown + success state with download
- ✅ 4.2.6 Seller dashboard — profile + 4 stat cards + Recharts BarChart + listings + recent sales
- ✅ 4.2.7 Seller payout system — 15% fee split + pending payout stat
- ✅ 4.2.8 Rating/review system — star ratings + review cards with reviewer avatar + relative time
- ✅ 4.2.9 "Sell Your Content" flow — full form with all fields + live earnings preview
- ✅ 4.2.10 Watermarked preview — rotated "PREVIEW" overlay on image + snippet box badge
