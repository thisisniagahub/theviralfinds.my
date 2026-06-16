# Task 2-D: Fasa 2.4 Multi-Platform Commission Comparison

## Summary
Built the cross-platform commission comparison feature that lets Malaysian affiliates see the SAME product's commission on Shopee, TikTok Shop, and Lazada in one view, with the best-paying platform highlighted.

## Files Created / Overwritten
| Path | Status |
|------|--------|
| `src/lib/compare/types.ts` | NEW |
| `src/lib/compare/matcher.ts` | NEW |
| `src/app/api/compare/route.ts` | NEW |
| `src/components/pages/compare-page.tsx` | OVERWRITTEN (was ComingSoon stub) |

## Matcher Algorithm (1-paragraph explanation)
Union-find clustering merges products from DIFFERENT platforms when their normalised-name token Jaccard similarity ≥ 0.5 (using top-5 signature tokens after stripping noise words like "Original", "Premium", "Malaysia", "Ready Stock") AND prices are within ±20% of each other. Category is NOT used as a matching criterion because raw category labels differ across platforms ("Beauty & Health" vs "Beauty" vs "Beauty"); the API instead pre-filters each platform's catalog by the unified category bucket before matching, so all products in a cluster share the same unified category.

## API Endpoint
**`GET /api/compare`**
- Query params: `q` (search query, optional), `category` (All | Beauty | Fashion | Electronics | Home | Food | Baby, default All), `sort` (best-commission | lowest-price | highest-rate, default best-commission)
- Returns `ComparisonResult`: `{ query, category, rows: ComparisonRow[], total, source: 'mock', summary: { avgBestCommission, shopeeWins, tiktokWins, lazadaWins, avgRateByPlatform, avgAmountByPlatform } }`
- Each `ComparisonRow` has: `productName, thumbnail, category, matchedOnPlatforms: PlatformCommission[], bestPlatform, bestCommissionAmount, matchCount, lowestPrice`
- Capped to 50 rows; auth-protected by existing NextAuth middleware (same as all other /api/* routes)

## UI Highlights
- Card View + Table View tabs (toggle)
- Summary bar chart at top (Recharts) — avg commission rate per platform + best-commission wins
- Winner column highlighted with Shopee orange ring + Crown badge
- Generate Link button calls the correct platform's generate-link endpoint and auto-copies URL to clipboard
- Loading skeletons, empty state, error retry state
- TanStack Query with queryKey `['compare', debouncedQuery, category, sort]`
- Framer Motion row entrance animations
- Mobile responsive (grid-cols-1 sm:grid-cols-3)

## Verification
- `bun run lint`: **PASS** (0 errors, 0 warnings)
- `curl http://localhost:3000/`: **HTTP 200** ✓
- `curl http://localhost:3000/api/compare?q=serum`: **HTTP 401** (expected — same auth pattern as all other platform APIs)

## Files NOT Modified (per task rules)
- `prisma/schema.prisma` (untouched — comparison is computed in-memory, no DB persistence needed)
- `src/store/app-store.ts`, `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-sheet.tsx`, `src/app/page.tsx` (already integrated by main agent — `'compare'` PageId and ComparePage registration already exist)
- `src/lib/tiktok/*`, `src/lib/lazada/*`, `src/lib/shopee/*` (only imported from, not modified)
