# P1-e — AI Content Generator Upgrade

**Task ID:** P1-e
**Agent:** full-stack-developer
**Wave:** 1 (Page-Level Upgrades)
**Target file:** `src/components/pages/content-page.tsx`
**Status:** ✅ Complete

## Context
You can view previous agents' work records in `/agent-ctx/`. Key relevant files for this task:
- `src/components/pages/content-page.tsx` (was 239 lines, basic Tabs UI — OVERWRITTEN)
- `src/app/api/content/generate/route.ts` (ZAI integration — unchanged)
- `src/app/api/content/library/route.ts` (CRUD — unchanged)
- `src/app/api/content/templates/route.ts` (8 static templates — unchanged)
- `src/lib/validation.ts` → `contentGenerateSchema` constrains tone to `[casual|professional|excited|funny]`

## What was built

### A. Rich Empty State
- **Custom inline SVG illustration**: animated magic wand (rotating body with star tip, purple→orange gradient) + 3 floating sparkle stars (staggered pulse) + breathing glow background circle. All via Framer Motion, no external images.
- **Headline**: "Your AI-generated caption will appear here" + subtext "Pick a template below or describe what you want to create."
- **"Try generating one →"** button — purple `bg-hermes`, scrolls to input card via `inputCardRef.scrollIntoView`.
- **"See example"** button — loads `SAMPLE_VARIATION` (Xiaomi Robot Vacuum Manglish caption) into the result card with an `isExample: true` flag + a sample banner reminder.
- **3 example content cards** (TikTok + Xiaomi Robot Vacuum, Instagram + Tudung Bawal Premium, Shopee Live + Instant Pot Duo):
  - Platform-colored gradient stripe at top
  - Platform icon badge (custom TikTok SVG path; lucide Instagram/Radio for others)
  - Product name + first caption line (line-clamp-2)
  - Star rating + engagement score (8.7/9.1/8.4)
  - **Hover reveals full-card purple overlay** with "Use this template" text
  - Click → pre-fills product + platform, switches to generator tab, scrolls to input

### B. Generation Animation
- **2.5s minimum hold** enforced via `Promise.all([minHoldPromise, apiPromise])` — even if backend returns instantly, user sees the full animation
- **5 status messages cycle every 500ms** (5 × 500ms = 2500ms = exact match):
  1. 🤖 HERMES is analyzing product...
  2. 🔍 Researching trending hashtags...
  3. ✍️ Writing in Manglish...
  4. 🎨 Adding emojis...
  5. ✨ Polishing the caption...
- Each message renders with `bg-clip-text text-transparent` purple gradient + **blinking cursor** (motion.span opacity [1,0,1] loop)
- **Animated purple orb** (Wand2 icon in gradient circle) with pulsing box-shadow ring (1.5s loop)
- **6 floating sparkles** with staggered y/scale/opacity loops
- **Progress bar** (shadcn Progress): 0→98% via 50ms interval over 2500ms, jumps to 100% on completion. Custom gradient `from-hermes to-hermes-dark`
- **Cancel button** (X icon) — sets `cancelRef.current = true`, clears all intervals, hides animation, toast "Generation cancelled"

### C. Result Card
- **Variations tabs** "Version 1 | 2 | 3" with `motion.div layoutId="var-underline"` animated underline. Max 3 variations; oldest dropped beyond 3. Sample variation shows orange "sample" badge.
- **Platform preview mock** (`PlatformPreview` component) — platform-specific UI:
  - **tiktok**: 150×268 phone-frame (zinc-900 bezel + notch), vertical gradient video area with product name, right-side action icons (Heart 12K / MessageSquare 847 / Share2 2.1K), bottom caption overlay with @theviralfindsmy handle + Music2 icon
  - **instagram**: square post with gradient avatar ring (fuchsia→pink→amber), "Sponsored" label, aspect-square gradient image with "1/1" pager, action bar (rose-filled Heart + MessageSquare + Share2 + Bookmark), 3-line caption with bold handle prefix
  - **shopee_live**: live stream card with orange→amber gradient header (LIVE badge + 2.4K viewer count with Eye icon), aspect-video gradient stream area with floating chat bubbles (@user1 "best gila! 🔥" / @user2 "grab now!"), bottom CTA bar "Special price RM 39.90" + orange "+ Cart" button
  - **youtube**: 16:9 thumbnail with play button overlay, 3:47 duration chip, title + 12K views · 2d ago
  - **facebook**: post card with f avatar, sponsored label, caption, gradient image, Like/Comment/Share row
- **Engagement prediction** (shopee-colored): TrendingUp icon + "8.5/10" + 5-star display. Computed deterministically via `predictEngagement()` content+platform+tone hash (7.5–9.9 range)
- **Full caption** in beautiful typography: `whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto custom-scrollbar`
- **Hashtag chips** extracted via `/#[\p{L}\p{N}_]+/gu` regex (Unicode-aware, supports Malay chars), deduplicated, rendered as purple pill buttons. Click → toast "Searching '{tag}' in trending hashtags…"
- **Three action buttons** (Tooltip-wrapped in header + duplicate row at bottom for mobile):
  - **Copy** → `navigator.clipboard.writeText()` → toast "Copied to clipboard!"
  - **Regenerate** → re-runs generation, adds new variation
  - **Save to Library** → `POST /api/content/library`, marks `isSaved: true` (button disabled, icon fills with shopee orange)
- **Sample banner** (Lightbulb + shopee color) shown when active variation `isExample === true`

### D. Template Gallery (visual grid)
6 visual cards in responsive grid (1/2/3 cols):

| Template | Platform | Type | Gradient | Uses | Rating |
|---|---|---|---|---|---|
| TikTok Unboxing Script | tiktok | script | pink→rose→orange | 1247 | 4.8 |
| Instagram Carousel Caption | instagram | caption | fuchsia→pink→purple | 892 | 4.7 |
| Shopee Live Script | shopee_live | live_script | orange→amber→yellow | 1543 | 4.9 |
| Product Comparison | instagram | comparison | emerald→teal→cyan | 634 | 4.6 |
| Raya Promo | tiktok | caption | amber→yellow→emerald | 2104 | 4.9 |
| Flash Sale Alert | shopee_live | caption | red→orange→amber | 1089 | 4.7 |

Each card: gradient thumbnail (h-32) + platform badge top-left (PlatformIcon + label in backdrop-blur pill) + big emoji center + hover overlay with white "Use Template" button. Below: name, blurb (line-clamp-2), uses count (Zap icon, shopee color), star rating, "Use →" ghost button.

Click → `handleUseTemplate()`: sets `type + platform + tone` (mapped from template's `language+tone`), switches to generator tab, scrolls to input, toast "Template applied".

Below the 6 visual cards: **"More templates from library"** section showing all 8 API templates (existing basic cards preserved for backward compat).

### E. Input Form Improvements
- **Product URL input with auto-detect**: `detectPlatformFromUrl()` checks for `shopee.com.my` / `tiktok.com` / `instagram.com` / `youtube.com` / `lazada.com.my` patterns. On match: sets platform + shows green "Detected: X" hint with Check icon. Also auto-extracts product name from URL slug (kebab-case → Title Case) when product field is empty.
- **Platform selector with icons**: each SelectItem renders `PlatformIcon` (custom TikTok SVG path + lucide Instagram/Youtube/Radio) inline before label
- **Tone selector**: 5 pill chips
  - Manglish 🇲🇾 → API tone=casual, language=manglish
  - Professional 💼 → API tone=professional, language=english
  - Casual 😊 → API tone=casual, language=english
  - Hype 🔥 → API tone=excited, language=manglish
  - Educational 📚 → API tone=professional, language=english
  
  (Mapping is necessary because `contentGenerateSchema` constrains tone to the 4 valid API enums. UI exposes 5 richer options without breaking the API contract.)
- **Length slider**: shadcn Slider, min=50 max=200 step=50. Value display in Badge ("Medium · 100 words"). 3 labels below (Short/Medium/Long) — active label highlighted in hermes color
- **Emoji density**: 4-button grid (None 🚫 / Sparse ✨ / Moderate 🎉 / Heavy 🤩). Active = `bg-shopee/10 text-shopee border-shopee`
- **Generate button with shimmer**: `bg-hermes hover:bg-hermes-dark` + absolute gradient overlay that translates from `-translate-x-full` to `translate-x-full` on hover (1000ms). Shows "HERMES is crafting…" with spinner when generating.
- **Advanced options collapsible**: Hashtag count select (Auto/5/10/15/25), CTA style select (Urgency/Curiosity/Direct/Soft), Target audience input. CollapsibleTrigger = ghost Button with Settings2 icon + rotating ChevronDown

## Technical Decisions

### Tone → API mapping
The validation schema constrains tone to `[casual|professional|excited|funny]`. To support the 5 richer UI tone options without modifying the schema or API route, a `toneConfig` lookup table at the call site emits the right `apiTone + apiLang` pair per UI tone selection. This preserves the existing API contract 100%.

### LocalStorage persistence
Variations array (max 6 entries) saved to `localStorage['hermes-content-variations']` on every change via `useEffect`. On mount, restores variations if present. Survives page reloads within a session — users don't lose their generated captions if they navigate away and back.

### 2.5s perceived value hold
```ts
const apiPromise = fetch('/api/content/generate', {...}).then(r => r.ok ? r.json() : Promise.reject(r))
const minHoldPromise = new Promise(resolve => setTimeout(resolve, MIN_HOLD_MS))
const [, data] = await Promise.all([minHoldPromise, apiPromise])
```
This guarantees the user always sees the full HERMES animation (status messages + progress bar) regardless of how fast the backend responds. Creates perceived value.

### Cancel mechanism
`cancelRef = useRef(false)` + `intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])`. On cancel: set ref true, clear all intervals, hide animation. The pending `Promise.all` checks `cancelRef.current` before applying the result, so a cancelled generation doesn't pollute the result card.

### Custom TikTok SVG icon
Lucide-react doesn't ship a TikTok brand icon. Implemented as an inline SVG path component (`PlatformIcon` switch). Instagram/Youtube come from lucide; Shopee Live uses lucide `Radio`; Facebook uses lucide `MessageSquare` as fallback.

### Color discipline
- `bg-hermes` (purple oklch 0.55 0.18 280) for AI/generate elements (Generate button, status messages, hashtag chips, tone pills, template hover overlay)
- `bg-shopee` (orange oklch 0.63 0.22 30) for save/engagement actions (Save to Library, engagement badge, emoji density active state, example card ratings)
- **NO indigo or blue used as primary** — only the Facebook mockup uses `bg-blue-600` for the f logo (brand-accurate)
- All gradients use warm purple→orange→pink→amber palettes

## Verification

### Lint
```bash
$ npx eslint src/components/pages/content-page.tsx
# (no output — 0 errors, 0 warnings, clean exit)
```

### Full project lint
```bash
$ bun run lint
# 4 pre-existing errors in OTHER files (sidebar.tsx, dashboard-page.tsx, trends-page.tsx, use-keyboard-shortcuts.ts) — all out of P1-e scope, untouched by this task
# 0 errors in content-page.tsx
```

### Dev server
- HTTP 200 on `/` after edit
- `✓ Compiled in 825ms` — no TypeScript errors
- No runtime errors in dev.log

### API contract preserved
- `POST /api/content/generate` still receives `{type, product, niche, platform, language, tone}` — client maps 5 UI tones to valid API tones
- `POST /api/content/library` unchanged
- `GET /api/content/templates` still powers the "More templates" section

## Files Modified
- `src/components/pages/content-page.tsx` — **OVERWRITTEN** (was 239 lines → ~1010 lines)

## Files NOT Modified
- `prisma/schema.prisma`
- `src/lib/validation.ts`
- `src/app/api/content/generate/route.ts`
- `src/app/api/content/library/route.ts`
- `src/app/api/content/templates/route.ts`
- `src/components/layout/sidebar.tsx`
- `src/app/page.tsx`
- `src/middleware.ts`

All API endpoints, validation schemas, and shared files left untouched — only the single page component was overwritten per the task spec.
