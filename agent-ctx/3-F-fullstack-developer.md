# Task 3-F — Fasa 3.6 AI Audience Analyzer

## Summary
Built the AI Audience Analyzer for TheViralFindsMY. Created audience types, deterministic Malaysian mock data, an API route using z-ai-web-dev-sdk with algorithmic fallback, and a full dashboard page.

## Files
- `src/lib/audience/types.ts` (NEW, ~165 lines)
- `src/lib/audience/mock-data.ts` (NEW, ~280 lines)
- `src/app/api/ai/audience/route.ts` (NEW, ~205 lines) — GET + POST, z-ai-web-dev-sdk BACKEND ONLY, algorithmic fallback, always returns `source: 'mock'|'ai'`
- `src/components/pages/audience-page.tsx` (OVERWRITTEN, ~620 lines) — full dashboard with demographics (BarChart/PieChart/location list), device mini-cards, interest RadarChart, 24×7 active-hours heatmap, content suggestions, audience growth LineChart, segments list, niche refine bar

## API
- `GET /api/ai/audience` → `{ profile, source, fallback? }`
- `POST /api/ai/audience { niche? }` → same envelope, niche-biased suggestions
- Auth: protected by NextAuth JWT middleware (same as all /api/* routes except those in PUBLIC_API_PREFIXES). SPA calls authenticated via session cookie.

## Mock data
- 5,847 unique clickers; 25-34 (42%) top age; Female 68% / Male 30% / Other 2%
- 9 Malaysian states (KL 28%, Selangor 22%, Penang 12%, Johor 11%, Sabah 8%, Sarawak 7%, Perak 5%, NS 4%, Kedah 3%)
- Mobile 78% / Desktop 18% / Tablet 4%
- Top interest Beauty (85%); peak hour 8 PM MYT; engagement 4.7%
- 8-month trend: 3,120 → 5,847 audience, 3.9% → 4.7% engagement
- 5 audience segments; 8 algorithmic content suggestions

## Charts
BarChart (age), PieChart (gender donut), RadarChart (interest affinity), LineChart (audience+engagement dual-axis), custom 24×7 heatmap grid (color-mix shopee orange → hermes purple).

## Colors
shopee orange + hermes purple + profit pink throughout. NO blue/indigo.

## Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings
- `curl http://localhost:3000/` → HTTP 200
- `curl http://localhost:3000/api/ai/audience` → HTTP 401 (expected — same auth middleware as all /api/* routes)

## Notes for downstream agents
- PageId `'audience'` already registered in app-store + sidebar; no shared files modified.
- `setActivePage('content')` is used by suggestion "Generate Content" buttons — the content page must render when that pageId is active.
- The API always returns mock data even on AI failure (final safety net), so the dashboard never breaks.
- Heatmap cell density is normalised 0-100 against the max cell; cell.bg uses `color-mix(in srgb, var(--color-shopee) X%, transparent)` and blends in `var(--color-hermes)` for density > 80.
