# Task 2-F: Cross-Platform Product Matcher

**Agent:** full-stack-developer
**Task ID:** 2-F
**Fasa:** 2.6 (5 subtasks)
**Status:** ✅ Complete

## Files Created / Overwritten

| Path | Action | Lines | Purpose |
|---|---|---|---|
| `src/lib/matcher/types.ts` | NEW | ~140 | Domain types (`MatchResult`, `MatchedPlatformProduct`, `AutoPickResult`, `MatcherConfig`, `MatchSearchResponse`, `AutoPickResponse`) + `DEFAULT_MATCHER_CONFIG` |
| `src/lib/matcher/service.ts` | NEW | ~480 | Matcher service: `searchAcrossPlatforms()`, `autoPickBest()`, `scoreMatch()`, `tokeniseName()`, `detectBrand()`, `jaccardSimilarity()`, `listingSimilarity()`, `clusterListings()`, `buildMatchResult()`, `makeSyntheticListings()` (async), `findMatchById()` + 5-min in-memory cache |
| `src/app/api/match/route.ts` | NEW | ~110 | `GET /api/match?q=...&limit=...` + `POST /api/match/auto-pick` (body `{ productId, productName? }`); always returns `source: 'mock'`; try/catch + NextResponse.json |
| `src/components/pages/matcher-page.tsx` | OVERWRITTEN | ~700 | Full UI: hero, big search bar + recent searches chips, stats bar, results grid with platform badges + commission highlight + auto-pick button, loading skeletons, detail Dialog with 3-column platform comparison, empty/no-results states, framer-motion stagger animations, TanStack Query, sonner toasts |

## Matching Algorithm

1. **Tokenise** each product name (lowercase, strip punctuation, remove ~70 Malaysian e-commerce stopwords like "original", "premium", "ready stock", "free shipping", "malaysia", "warranty").
2. **Jaccard similarity** between token sets of two listings (0–1).
3. **Brand-match boost** (+0.15) — 25 brands regex-detected (Xiaomi, Samsung, Apple, Garnier, Cetaphil, LANEIGE, Some By Mi, Anessa, Maybelline, Nivea, Bioaqua, Safi, Wardah, Philips, Anker, Dyson, Sony, Nike, Adidas, Puma, MamyPoko, Maggi, Nestle, Uniqlo, LEGO).
4. **Category-match boost** (+0.10) — categories normalised to shared vocabulary across the 3 platforms.
5. **Price-proximity boost** (+0.10) — if prices within 30% of each other.
6. **Greedy cluster** — walk listings, assign each to the first existing cluster whose anchor has similarity ≥ 0.35; never add a second listing from the same platform (so each cluster has at most 1 listing per platform).
7. **Relevance score** (0–100) per cluster: 55% token-overlap + 20% startsWith + 15% substring + 10% category match, plus +5 per extra platform (capped at 100).
8. **Sort** by relevance desc → commissionAmount desc → top 20.
9. **Synthetic fallback** — if real match count < 3, generate a 3-platform cluster by relabelling random products from each platform with the query.
10. **Cache** results 5 min so `autoPickBest(matchId)` can look up the cluster without re-searching.

## API Endpoints

- **GET `/api/match?q=<keyword>&limit=<n>`** → `MatchSearchResponse { query, results[], total, platformsSearched, bestCommissionAmount, source: 'mock' }`
- **POST `/api/match/auto-pick`** body `{ productId, productName? }` → `AutoPickResponse { result: AutoPickResult, source: 'mock' }`

Both wrapped in try/catch + NextResponse.json; both always include `source: 'mock'` per spec. Both return HTTP 401 unauthenticated (same global auth middleware as all other `/api/*` routes — expected behaviour).

## Verification

- `bun run lint` → **PASS** (0 errors, 0 warnings, exit 0)
- `bunx tsc --noEmit --skipLibCheck` → **PASS** (0 errors in any matcher/match file)
- `curl http://localhost:3000/` → **HTTP 200** (page loads)
- `curl http://localhost:3000/api/health` → **HTTP 200**
- `curl "http://localhost:3000/api/match?q=iphone"` → **HTTP 401** (expected — auth middleware)
- Dev server log: clean compiles, no errors

## Notes

- The `src/lib/compare/matcher.ts` file mentioned in the task spec did NOT exist (Task 2-D Compare was not actually completed by a previous agent — `src/lib/compare/` directory was empty). Implemented my own matching algorithm from scratch.
- Did NOT modify any protected files. Only imported from `@/lib/shopee/mock-data`, `@/lib/tiktok/mock-data`, `@/lib/lazada/mock-data` as instructed.
- The `'matcher'` PageId + `'Product Matcher'` nav item were already registered by a previous agent — page is accessible via sidebar without any store/sidebar modifications.
- Mock data strategy: aggregates products from all 3 platform mock-data files via their public `searchProducts()` API. For unknown queries, calls `searchProducts('')` (returns full catalog) on each platform and relabels random products with the query.
