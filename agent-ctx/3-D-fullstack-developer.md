# Task 3-D — Fasa 3.4 AI A/B Content Testing

## Summary
Built the complete AI A/B Content Testing system for TheViralFindsMY. Generates 3 distinct content variants per request (Direct & Punchy / Story-Driven / Urgency-Focused), scores each with an algorithmic 4-dimension predictor (Hook / CTA / Hashtags / Emotion), and tracks actual performance after posting. Includes 5 pre-seeded Malaysian past tests with realistic Manglish content + actual performance data so the dashboard has history on first load.

## Files

### Created (5)
- `src/lib/abtesting/types.ts` (NEW — ~165 lines)
  - 11 types: `VariantLabel`, `VariantStyle`, `AbPlatform`, `AbNiche`, `AbTone`, `PredictionBreakdown`, `PerformanceMetric`, `ContentVariant`, `VariantScore`, `AbTestResult`, `GenerateRequest/Response`, `TrackRequest/Response`, `ListResponse`
  - `VARIANT_STYLE_META` constant — display metadata (emoji, name, description) per style

- `src/lib/abtesting/scorer.ts` (NEW — ~225 lines)
  - `scoreHookStrength(content)` → 0-100 (emoji-at-start, power words, Manglish slang, ALL-CAPS, !/? punctuation, hook length)
  - `scoreCTAClarity(content)` → 0-100 (CTA verbs, link/bio/DM refs, urgency words, action emojis, CTA-in-last-40%)
  - `scoreHashtagMix(content, hashtags?)` → 0-100 (count sweet spot 5-9, diversity, disclosure tag, platform tag, long-tail niche tag)
  - `scoreEmotionalTrigger(content)` → 0-100 (emotional slang density, emoji density, exclamation density)
  - `calculatePredictedScore(content, hashtags?)` → weighted combine (Hook 0.30 / CTA 0.25 / Hashtags 0.20 / Emotion 0.25)
  - `extractHashtags(content)` — Unicode-aware #word extractor
  - `scoreBand(score)` — color tokens (emerald/lime/amber/orange/red) for UI

- `src/lib/abtesting/mock-data.ts` (NEW — ~210 lines)
  - `generateTemplateVariants(product, platform, niche, tone?)` — algorithmic fallback producing 3 distinct A/B/C variants (returns unscored; caller scores)
  - 5 pre-built past tests: Garnier Serum, Xiaomi Buds, Baju Kurung Moden, Philips Air Fryer, Maggi Pedas Gila
  - Module-level `abTestingStore.tests: Map<string, AbTestResult>` seeded with the 5 mock tests
  - ID generators: `newTestId()`, `newVariantId()`

- `src/app/api/abtesting/generate/route.ts` (NEW — ~205 lines)
  - `POST` — validates `{product, platform, niche, tone?}` via Zod, enforces `RATE_LIMITS.ai`
  - Runs 3 parallel `zai.chat.completions.create` calls (Promise.allSettled) with distinct per-style system prompts (Direct & Punchy / Story-Driven / Urgency-Focused)
  - Each variant independently falls back to template on AI failure
  - All variants scored via `calculatePredictedScore`
  - Persists new test to in-memory store
  - Always includes `source: 'ai' | 'mock'` (per-variant + overall — overall is 'ai' only if all 3 succeeded)
  - `GET` — returns latest test (convenience)

- `src/app/api/abtesting/track/route.ts` (NEW — ~135 lines)
  - `POST` — validates `{variantId, actualClicks, actualConversions}` via Zod, enforces `RATE_LIMITS.write`
  - Locates variant across all tests, updates its `actual` PerformanceMetric (clicks, conversions, CTR, loggedAt)
  - Auto-determines winner (highest CTR among variants with logged actual)
  - `GET` — lists all past tests (newest first), optional `?productId=` filter

### Overwritten (1)
- `src/components/pages/abtesting-page.tsx` (was 6-line ComingSoonPage stub, now ~530-line full dashboard)
  - Header: title + subtitle + Fasa 3.4 badge + Framer Motion entrance
  - "New A/B Test" generator card: product input, platform/niche/tone selectors, optional tone override checkbox, "Generate 3 Variants" button with loading state
  - Two-tab layout:
    - **Current Test**: 3 variant cards in responsive grid (1 col mobile / 3 col md+), staggered Framer Motion reveals (idx * 0.12s delay)
    - **Past Tests**: scrollable list with custom scrollbar, winner highlighted, predicted-vs-actual comparison per variant
  - Each VariantCard:
    - Header: label badge, style name, source badge (AI/Template), winner trophy, large color-coded predicted score
    - 4 mini Progress bars for score breakdown (Hook/CTA/Hashtags/Emotion)
    - Content quote block (left-border accent, max-h-52 with scroll)
    - Hashtag chips
    - "Copy Content" + "Use This Variant" buttons
    - Actual performance tracker: clicks/conversions inputs + "Log Results" button (when not logged) OR emerald summary card with 3 stats (clicks/conversions/CTR) when logged
  - TanStack Query: `useMutation` for generate + track, `useQuery` for past tests, `useQueryClient` for invalidation
  - sonner `toast` for all feedback
  - Skeleton loaders during pending state
  - `'use client'` directive
  - Wrapped in `max-w-7xl mx-auto p-4 md:p-6 space-y-6` per spec

## API Endpoints

| Method | Path | Body / Query | Response | Notes |
|---|---|---|---|---|
| POST | `/api/abtesting/generate` | `{product, platform, niche, tone?}` | `GenerateResponse` | ZAI-backed, per-variant fallback, rate-limited `ai` preset |
| GET  | `/api/abtesting/generate` | — | `AbTestResult` (latest) | Convenience |
| POST | `/api/abtesting/track` | `{variantId, actualClicks, actualConversions}` | `TrackResponse` | Auto-selects winner by CTR |
| GET  | `/api/abtesting/track` | `?productId=` (optional) | `ListResponse` | Newest first |

Auth: protected by the same NextAuth JWT middleware as all other `/api/*` routes (401 when unauthenticated, 200 with session cookie). Verified end-to-end with `demo@theviralfindsmy.com` / `demo123`.

## Scoring Algorithm

Transparent, deterministic, no-ML. Each scorer returns 0-100 based on countable content features tuned for Malaysian Manglish affiliate content:

- **Hook (30% weight)**: First ~80 chars. +20 emoji-at-start, +20 power word in first 6 words, +15 Manglish slang, +15 ALL-CAPS word, +15 ! or ?, +15 concise length (5-80 chars).
- **CTA (25%)**: Whole content. +30 CTA verb (click/tap/grab/beli/sekarang/link bio/etc.), +25 link/DM reference, +20 urgency word (last/limited/today/sekarang/etc.), +15 action emoji (👉🔗⏰🛒🛍️), +10 CTA in last 40% of content.
- **Hashtags (20%)**: +50 count in sweet spot (5-9), +35 acceptable (3-12), +20 minimal (1+). +10 all-unique. +15 disclosure tag (#ad/#promosi). +15 platform tag (#ShopeeMY/#TikTokMadeMeBuyIt/#LazadaMY). +10 long-tail niche tag (>8 chars).
- **Emotion (25%)**: Baseline 20. +count of emotional slang (gila/shiok/walao/cedebest/terer/cun/kaw/etc.). 5+ hits = 100. +10/15 emoji density bonus. +5/10 exclamation density bonus.

Combined: `round(Hook*0.30 + CTA*0.25 + Hashtags*0.20 + Emotion*0.25)`, clamped 0-100.

**Why these weights**: Hook + CTA dominate (55% combined) because they drive the two highest-leverage moments — scroll-stop and click. Hashtags + Emotion are supporting signals (45%) that amplify reach and resonance but can't compensate for a weak hook or unclear CTA.

## Verification

- `bun run lint` → **exit 0** (0 errors, 0 warnings)
- `curl http://localhost:3000/` → **HTTP 200**
- `curl http://localhost:3000/api/abtesting/track` (unauth) → HTTP 401 (expected — same auth middleware as all `/api/*`)
- End-to-end with demo session:
  - POST `/api/abtesting/generate` `{product:"Garnier Vitamin C Serum 30ml", platform:"shopee", niche:"Beauty", tone:"Hype"}` → returned 3 variants: A (AI, score 95), B (AI, score 62), C (template fallback due to rate limit, score 93). Overall source: 'mock'.
  - GET `/api/abtesting/track` → returned 6 tests (5 seed mock + 1 new).
  - POST `/api/abtesting/track` `{variantId, actualClicks:250, actualConversions:35}` → variant updated with `actual: {clicks:250, conversions:35, ctr:14}`, auto-marked as winner (highest CTR among logged variants). Response included updated variant + full test.

## Notes for downstream agents
- `PageId 'abtesting'` was already registered in the app-store + sidebar (came from initial repo). My page component simply replaces the stub — no shared files modified.
- The in-memory `abTestingStore` is module-level — restarts will lose user-tracked data (only the 5 seed mock tests persist). If a future agent adds a Prisma `ContentVariant` model, they should swap the store with `db.contentVariant.*` calls — the API contract stays the same.
- `VARIANT_STYLE_META` is exported from `types.ts` so other components can reuse variant display metadata.
- The scorer is side-effect free and exported — future agents can reuse `calculatePredictedScore()` for any content-scoring feature (e.g. content library sort, scheduler prioritisation).
EOF
echo "Agent-ctx record written."
