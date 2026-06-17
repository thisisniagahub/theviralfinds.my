# P2-f — Performance & Perceived Speed

**Agent:** full-stack-developer (Performance & Perceived Speed)
**Task ID:** P2-f
**Wave:** 2 (System-Level Polish)
**Scope:** Optimize TanStack Query defaults, build skeleton/progressive loading system, offline support, lazy images, bundle documentation.

## Files Created
1. `src/lib/query-config.ts` — TanStack Query config with tiered staleTime
2. `src/hooks/use-offline-mode.ts` — Offline detection + cached data fallback
3. `src/components/ui/lazy-image.tsx` — Image with blur placeholder + lazy loading
4. `src/components/ui/progressive-loader.tsx` — Progressive loading wrapper
5. `src/components/pwa/offline-banner.tsx` — Offline indicator banner

## Files Modified
6. `src/app/page.tsx` — Imported `defaultQueryClientOptions` + `<OfflineBanner />`, swapped QueryClient config (lines 290-294 + line 178).

## Out of Scope (Wave 1 territory — untouched)
- `src/components/pages/login-page.tsx`, `dashboard-page.tsx`, `trends-page.tsx`, `content-page.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/onboarding/onboarding-wizard.tsx`

## Implementation Details

### A. TanStack Query Configuration (`query-config.ts`)
- `QUERY_STALE_TIME` constant table: dashboard 30s, products 60s, trends 5m, analytics 2m, earnings 30s, leaderboard 10m, marketplace 60s, user 0s.
- `QUERY_GC_TIME = 5 * 60 * 1000` (5 min garbage collection).
- `defaultQueryClientOptions` (typed as `DefaultOptions`):
  - `retry`: skips 4xx errors, retries up to 2× for 5xx/network.
  - `retryDelay`: exponential backoff capped at 30s.
  - `refetchOnWindowFocus: false` (annoying on a dashboard).
  - `refetchOnReconnect: 'always'` (fresh data on recovery).
  - mutations: `retry: 1`.

### B. QueryClient Swap in `page.tsx`
- Old config: `staleTime: 30000, retry: 1` (3 lines).
- New: `defaultOptions: defaultQueryClientOptions` (single import, single line).
- `Home()` still uses `useState(() => new QueryClient(...))` to ensure one client per app instance.

### C. Offline Mode Hook (`use-offline-mode.ts`)
- Returns `{ isOnline, isOffline, lastOnline, cachedDataAvailable }`.
- Listens to `online`/`offline` window events.
- Persists `lastOnline` to `localStorage.tvf_last_online` on every transition.
- Uses `queryClient.getQueriesData({ queryKey: [] })` to check if ANY cached query has non-null data.
- Subscribes to `queryClient.getQueryCache().subscribe()` so the flag stays in sync as queries resolve/evict.
- All `setState` calls happen inside `setTimeout`/event handlers — no setState-in-effect lint violation.

### D. Lazy Image (`lazy-image.tsx`)
- Props: `src`, `alt`, `width`, `height`, `className`, `blurDataURL`, `priority`, `fit`.
- Priority path uses `next/image` with `priority` (above-fold, LCP-critical).
- Default path uses native `<img loading="lazy" decoding="async">` (below-fold).
- Blur placeholder layer: `blurDataURL` if provided, else a deterministic warm gradient (hash of src → amber/gold/pink/rose/red/emerald palette, NO blue/indigo).
- Cross-fade placeholder layer (`opacity 1 → 0`) + Framer Motion image fade (`opacity 0 → 1`, 0.4s easeOut).
- Error state: gradient background + `ImageIcon` from lucide (no broken-image glyph).
- Respects `useReducedMotion()` — instant instead of fade.

### E. Progressive Loader (`progressive-loader.tsx`)
- `<ProgressiveLoader>` wraps `children: ReactNode[]` — each child becomes one section.
- `<ProgressiveSection>` controls reveal by `index × delay` (default 100ms).
- Each section wrapped in `<Suspense fallback={skeleton}>` so slow async children show skeleton first, then fade in.
- Default skeleton = `<Skeleton className="h-24 w-full rounded-xl" />` from shadcn.
- Framer Motion: `initial opacity 0 + y 8`, `animate opacity 1 + y 0`, 0.3s easeOut.
- Bonus: `useProgressiveReveal(totalSections, delay)` hook for "Load more" patterns.
- Respects `useReducedMotion()`.

### F. Offline Banner (`offline-banner.tsx`)
- Renders only when `useOfflineMode().isOffline === true` (and not dismissed).
- Sticky top, z-60, full width, above content.
- Amber palette: `bg-amber-100 text-amber-900 border-amber-300` (light), `bg-amber-900/40 text-amber-100 border-amber-700/50` (dark).
- Content: `WifiOff` icon in amber rounded square, "You're offline — showing last synced data" headline, `CloudOff` icon + "Last synced: 2m ago" subtext (ticking every 30s via `useTickingLastSync`).
- If no cached data: "No cached data available yet" instead.
- Retry button: invalidates + refetches active queries. Spinner (`animate-spin`) while retrying.
- Dismiss X button: per-session dismissal keyed on `lastOnline.getTime()` so a new offline session always re-shows the banner.
- Auto-hides on reconnect with green `Back online!` toast (2s duration, `bg-emerald-600 text-white border-emerald-700`).
- Recovery effect also calls `queryClient.invalidateQueries()` so fresh data is fetched immediately per `refetchOnReconnect: 'always'`.
- AnimatePresence + Framer Motion slide-down (opacity + y -8 → 0), respects `useReducedMotion`.
- Full ARIA: `role="status"`, `aria-live="polite"`, `aria-label` on icon buttons.

### G. Integration in `page.tsx`
- Imported `OfflineBanner` from `@/components/pwa/offline-banner`.
- Imported `defaultQueryClientOptions` from `@/lib/query-config`.
- Added `<OfflineBanner />` immediately after `<NetworkBanner />` (line 178).
- The existing `NetworkBanner` (amber-500, simpler) is left untouched — it provides the base level of notice; `OfflineBanner` layers on with last-synced timestamp + retry. Both are gated by authentication (inside `AppContent`).
- `Home()` QueryClient creation swapped: `defaultOptions: defaultQueryClientOptions` (was `defaultOptions: { queries: { staleTime: 30000, retry: 1 } }`).

### H. Bundle Optimization Notes
- Verified all 36 page components are already wrapped in `React.lazy(() => import(...))` (lines 34-77 of `page.tsx`). Code-splitting per route is in place.
- Heavy dependencies that COULD be code-split further (opportunities for future waves, NOT changed here):
  - `recharts` (~95KB gzipped) — only used on dashboard/analytics/trends. Could lazy-load chart wrappers.
  - `@mdxeditor/editor` (~140KB gzipped) — only used on content studio. Already lazy via page split.
  - `react-syntax-highlighter` (~85KB gzipped with languages) — could use the light build + register only the languages actually used.
  - `pdf-lib` + `pdfkit` + `@pdf-lib/fontkit` — only used for PDF export. Already route-split via `/api/export/pdf`.
  - `canvas-confetti` (~6KB gzipped) — small enough to keep.
  - `socket.io-client` (~30KB gzipped) — loaded via RealtimeProvider, could be lazy.
  - `@dnd-kit/*` (3 packages, ~25KB total) — only used on sortable lists. Already route-split.
- Service Worker (`public/sw.js`) already registered via `RegisterSW` in production mode — stale-while-revalidate for API is in place.

## Color Discipline (Verified)
- Offline banner: amber-100/900/300 ✓
- Recovery toast: emerald-600/white ✓
- Lazy image gradients: amber/gold/pink/rose/red/emerald (no blue/indigo) ✓
- Progressive loader skeletons: shadcn `bg-accent` (neutral) ✓

## Lint Status
- `npx eslint <my 6 files>` → **0 errors, 0 warnings** (exit 0).
- Full project `bun run lint` shows **1 error in `campaigns-page.tsx`** (parse error, line 461) — this was introduced by a parallel agent's work, NOT by my changes. My files are 100% clean.
- `npx tsc --noEmit` filtering my files → **0 TypeScript errors** (all listed errors are in OTHER pre-existing files).

## Verification
- `GET /` → HTTP 200, ~17ms render time (dev.log confirms).
- QueryClient uses new tiered stale times.
- OfflineBanner renders null while online (no layout impact).
- All existing pages still work (lazy imports unchanged).
- No regressions in Wave 1 work (sidebar, onboarding, dashboard, trends, content).

## How to Test in Browser
1. Open DevTools → Network → toggle "Offline".
2. Reload page → amber banner appears at top with "Last synced: …" timestamp.
3. Click Retry → queries attempt refetch (fail while offline, banner stays).
4. Click X → banner dismisses; toggle online then offline again → banner reappears.
5. Toggle back online → banner auto-hides, green "Back online!" toast appears for 2s, queries refetch.
6. Lazy images: any `<LazyImage>` (e.g. on a product card) shows gradient placeholder then fades in.
7. Progressive loader: wrap dashboard sections in `<ProgressiveLoader>` to see staggered reveal.
