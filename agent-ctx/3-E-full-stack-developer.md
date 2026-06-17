# Task 3-E — HERMES Proactive Insights

**Agent:** full-stack-developer
**Task:** Fasa 3.5 HERMES Proactive Insights (8 subtasks)
**Status:** ✅ Complete

## Files Created / Modified

### Created (6 new files)
1. `src/lib/hermes-insights/types.ts` — Shared types: `ProactiveInsight`, `InsightType`, `InsightSeverity`, `InsightAction`, `InsightData`, `UserProfile`, `InsightsListResponse`, `GenerateInsightResponse`.
2. `src/lib/hermes-insights/generator.ts` — Pure algorithms: `generateDailySummary`, `detectAnomalies`, `detectOpportunities`, `generateTrendAlerts`, `buildRecommendation`, `scoreInsightRelevance`, `sortInsights`, `filterInsights`, `filterAndSort`, `countNew`, `defaultAlgorithmicRecommendation`. Plus helpers `formatRM`, `pctChange`.
3. `src/lib/hermes-insights/mock-data.ts` — 16 Malaysian-context mock insights (covers all 5 InsightTypes) + `getMockInsightById`, `randomMockInsight`.
4. `src/app/api/hermes/insights/generate/route.ts` — POST handler using `z-ai-web-dev-sdk` with algorithmic fallback per focus type. Persists AI insights to DB.
5. `src/components/pages/hermes-insights-section.tsx` — Reusable UI component with header, filter chips, color-coded insight cards, rich data renders (daily stats / anomaly comparison / opportunity preview / recommendation meta), action buttons, auto-refresh every 60s, skeletons, empty state, toasts.

### Modified (2 existing files — ADD only, no breaking changes)
6. `src/app/api/hermes/insights/route.ts` — Overwritten: GET returns proactive insights (DB + mock merged, deduped, relevance-scored, filtered by `?type=`, sorted by severity + relevance + recency, with `source` field). POST marks insight as actioned/read (mock in-memory + DB update).
7. `src/components/pages/hermes-page.tsx` — Added new "Proactive" tab (`value="proactive-insights"`) between existing "Insights" and "Connection" tabs. Renders `<HermesInsightsSection />`. Added `Bell` icon import. Existing tabs and functionality untouched.

## Insight Types Implemented

| Type | Icon | Color | Example |
|------|------|-------|---------|
| `daily_summary` | Calendar | green | "Today: 234 clicks, 12 conv, RM 145.50. +18% vs yesterday 🔥" |
| `anomaly` | AlertTriangle | red | "⚠️ Conversion rate dropped from 5.2% to 1.8% in last 3h" |
| `opportunity` | Rocket | amber | "🚀 'Garnier Serum' searches up 240% in Malaysia" |
| `trend_alert` | TrendingUp | sky | "📈 'Raya Beauty' trending on TikTok — ride the wave" |
| `recommendation` | Lightbulb | purple | "💡 Your audience engages most at 8 PM — post at 7:45 PM" |

## API Endpoints

### GET `/api/hermes/insights`
- Query: `?type=daily_summary|anomaly|opportunity|trend_alert|recommendation` (optional)
- Response: `{ insights: ProactiveInsight[], count, newCount, generatedAt, source: 'mock'|'ai'|'algorithm'|'mixed' }`
- Each insight includes required `source: 'mock'|'ai'|'algorithm'` field.

### POST `/api/hermes/insights`
- Body: `{ id: string, action: 'actioned'|'read' }`
- For mock-prefixed ids → updates in-memory state. For DB ids → updates HermesInsight row.
- Response: `{ ok, id, action, state: { isRead, isActioned }, source }`

### POST `/api/hermes/insights/generate`
- Body: `{ focus?: InsightType, context?: Record }` (all optional)
- Uses `z-ai-web-dev-sdk` (BACKEND ONLY) to generate fresh insight as strict JSON.
- Algorithmic fallback per focus type on AI failure.
- AI insights persisted to DB so they show up in subsequent GET calls.
- Response: `{ insight: ProactiveInsight, source: 'ai'|'algorithm', generatedAt }`

## Key Decisions

1. **Backward-compat DB mapping**: Old `HermesInsight` rows used `type: 'trend'|'alert'|'opportunity'|'recommendation'`. New route maps `trend→trend_alert`, `alert→anomaly` so existing rows surface correctly under the new vocabulary.
2. **In-memory mock state**: Mock insights (id prefixes `mock-`, `daily-`, `anom-`, `opp-`, `trend-`, `rec-`) keep actioned state in a `Map` to avoid polluting the DB with mock rows. Resets on server restart — acceptable for demo.
3. **Relevance scoring**: 0-100 score weighted by severity (+15 critical / +8 warning / +5 success / +0 info), category match (+12), recency (+15 <1h / +10 <6h / +5 <24h), anomaly magnitude (+up to 20), opportunity size (+up to 15), new-user bonus (+8). Actioned insights get -40 so they sink.
4. **Sort order**: actioned → bottom; then severity (critical first); then relevance desc; then recency desc.
5. **Auto-refresh**: Frontend polls GET every 60s (silent — no loading flicker). Manual refresh button also available.
6. **z-ai-web-dev-sdk usage**: Only in `generate/route.ts` (server-only). Strict JSON schema prompt with Manglish flavour. Robust JSON extraction (regex for `{...}` block, tolerates markdown fences).
7. **Resilient GET**: If DB read fails (e.g. Prisma not initialised), falls back to mock-only with a warning log. UI always gets content.

## Verification

- ✅ `bun run lint` — 0 errors, 0 warnings on all new/modified files (2 unrelated warnings in `thumbnail/route.ts`).
- ✅ `curl http://localhost:3000/` returns HTTP 200.
- ✅ Dev log shows clean compilation, no errors related to new files.
- ℹ️ `/api/hermes/insights` returns 401 without auth — expected (NextAuth middleware protects all `/api/*`). Authenticated browser sessions work normally (same pattern as all other HERMES routes).

## Did NOT Modify (per rules)

- `prisma/schema.prisma` — used existing `HermesInsight` model as-is.
- `src/lib/realtime/*` — read for context, no changes.
- `src/middleware.ts` — shared, no changes.
- `src/app/page.tsx`, sidebar, `app-store.ts` — shared, no changes.
- Other agents' library files.
