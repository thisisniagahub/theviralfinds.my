# Task P1-a — Landing Page → Conversion Machine

**Agent:** full-stack-developer
**Wave:** 1 (page-level upgrades)
**Target file:** `src/components/pages/login-page.tsx`

## Goal
Transform the existing 356-line login-page.tsx (split-screen brand+form layout) into a full marketing landing page that converts visitors. Login form becomes one section near the bottom with smooth-scroll target from "Start Free" CTAs.

## What was built

### Sections (top → bottom)
1. **Hero** — headline `"The Only AI-Powered Platform Built Exclusively for Malaysian Shopee Affiliates"` with gradient highlight; subhead `"Generate Links. Track Earnings. Create Content. All in One Place."`; primary CTA `Start Free` (smooth-scrolls to `#auth`); secondary CTA `Watch Demo` (opens `DemoVideoDialog`). Right column: animated dashboard mockup card with window chrome, mini KPIs, 7-day bar chart, and 4 floating accent cards (`Today's Earnings`, `Conversion Rate`, `HERMES AI`, `Trending Now`) each with independent floating y-axis animation + entrance reveal.
2. **Live Stats Ticker** — 4 KPIs with count-up animation triggered when scrolled into view (`useInView` from framer-motion + rAF loop): `RM 47,382 earned today`, `12,847 active affiliates`, `2.3M links generated`, `RM 8.9M total payouts`.
3. **Social Proof Band** — 6 creator "logos" (colored circles with initials + names + Shopee-verified BadgeCheck icons) + 3 testimonial cards with 5-star ratings, Manglish/BM quotes, avatars, earnings stats, and verified badges.
4. **Feature Showcase** — 3 alternating left/right sections (Trend Spy, AI Content, Analytics), each with scroll-reveal copy + bullet checklist + bespoke mock visual (trending product list / generated Manglish caption with hashtag chips / KPI cards + 12-bar chart).
5. **Pricing Preview** — 4 tiers (Free RM0 / Pro RM49 / Business RM149 / Enterprise Custom) in responsive 1→2→4 grid; Pro tier highlighted with `ring-2 ring-shopee/40`, `Most Popular` badge, lifted `-mt-2`; each tier has CTA that smooth-scrolls to auth.
6. **Trust Badges** — 4-icon row (`Secured by SSL` / `Official Shopee Affiliate Partner` / `GDPR Compliant` / `Bank-grade Encryption`) using Shield, Lock, BadgeCheck, Globe lucide icons.
7. **Auth Section** — Existing login form refactored into its own section. Added prominent `Continue with demo account` button (one-click demo login) above the email/password form. Kept all existing functionality: NextAuth credentials login, demo credential fill, password show/hide, Google/Facebook OAuth (conditional on `/api/auth/providers`), switch to register (`setAuthView('register')`).
8. **Footer** — sticky (via `mt-auto` on root `min-h-screen flex flex-col` wrapper), brand mark + Sign In / Privacy / © year.

### Animations (Framer Motion v12)
- Hero: staggered fade-in-up on badge → headline → subhead → CTAs → trust checks.
- Floating cards: independent `y: [0, -6, 0]` infinite loops with different durations for organic motion.
- Dashboard bar chart: each bar animates `height: 0 → x%` with staggered delays.
- StatsTicker: `CountUp` component — rAF-based ease-out cubic, triggered once via `useInView({ once: true, margin: '-50px' })`.
- Testimonials / Feature blocks / Pricing cards: `whileInView` + `viewport={{ once: true, margin: '-50px' }}` with staggered delays + `whileHover={{ y: -4 }}` lift.
- Feature showcase: alternating x-axis reveal (copy slides from one side, mock from the other).

### Color palette (NO indigo / NO blue)
- Primary: `bg-shopee` (#ee4d2d orange family) + `text-shopee` / `bg-shopee/10`
- Secondary: `bg-hermes` (purple family) + `text-hermes` / `bg-hermes/10`
- Accents: `amber-500` (trend), `emerald-500` (positive deltas), `violet-500` (AI content), `rose-500` / `teal-500` (creator avatars only)
- Neutrals: `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-card`, `border-border`
- Theme-aware: every section uses CSS variables so dark mode just works.

### Responsive (mobile-first)
- Hero: 1-column on mobile (copy above mockup), 2-column on `lg:`.
- Hero floating cards: positioned with smaller offsets on mobile (`top-8 right-4` → `sm:right-8`).
- Stats ticker: 2-col grid on mobile, 4-col on `lg:`.
- Testimonials: 1-col on mobile, 3-col on `md:`.
- Feature showcase: 1-col on mobile, 2-col on `lg:`.
- Pricing: 1-col on mobile, 2-col on `sm:`, 4-col on `lg:`.
- Trust badges: 2-col on mobile, 4-col on `lg:`.
- All interactive elements ≥ 44px (h-11 / size-10 buttons + avatars).

### Accessibility
- Semantic `<main>`, `<section>`, `<footer>` tags.
- `role="alert"` on error banner.
- `aria-label` on password show/hide toggle.
- `aria-hidden` on decorative blobs + Quote icon.
- `sr-only` already provided by Dialog close button.
- Ref-based smooth scroll target with `scroll-mt-4` for fixed-header offset.
- Touch targets ≥ 44px throughout.

### Tech notes / decisions
- **Inlined `CountUp` component** instead of importing the project's existing `useCountUp` hook (`src/hooks/use-count-up.ts`, shipped by P2-b). Reason: the existing hook's `enabled: false` behaviour sets `displayValue = target` immediately, which causes a "flash of final value" before scroll-into-view. My inline version starts at 0 and only animates when `inView` becomes true. The inline implementation is self-contained (rAF + ease-out cubic) and passes lint cleanly. setState happens inside the rAF callback (async), satisfying the `react-hooks/set-state-in-effect` lint rule.
- **OAuth provider detection** refactored from `.then()` chain to async IIFE inside `useEffect` with a `cancelled` flag for proper cleanup — functionally identical to original, just cleaner.
- **Demo login** — added new `handleDemoLogin` that one-shot calls `login('demo@theviralfindsmy.com', 'demo123')` without requiring the user to click Sign In separately. Button is the most prominent CTA in the auth section (shopee-tinted outline above the form).
- **Smooth scroll** relies on the project's existing `html { scroll-behavior: smooth }` (in globals.css). `scrollIntoView({ behavior: 'smooth', block: 'start' })` is the explicit fallback.
- **DemoVideoDialog** is a placeholder (`Dialog` from shadcn) — shows a play-button mock with copy explaining the 60-second walkthrough is "coming soon", with a hint to click Start Free for live demo. Wraps in `AnimatePresence` for clean exit.
- **No new dependencies** — only uses libraries already in the project (framer-motion, lucide-react, shadcn/ui, sonner, next-auth via store).

## Lint status
- `npx eslint src/components/pages/login-page.tsx` → **0 errors, 0 warnings** ✓
- `bun run lint` (full project) → 1 pre-existing error in `src/hooks/use-keyboard-shortcuts.ts` (P1-f's task) + 1 pre-existing warning in `src/hooks/use-count-up.ts` (P2-b's task). **Not introduced by P1-a.** My file is clean.

## Dev server
- `GET /` returns 200 with the new landing page rendering (verified via `dev.log`).
- No TypeScript or runtime errors. Page compiles in ~500ms.
- `/api/auth/providers` continues to return 200 (preserved OAuth detection).

## Files modified
- `src/components/pages/login-page.tsx` — full rewrite, ~960 lines (was 356). Single client component, no other files touched.

## Verification checklist (from POLISH.md P1-a)
- [x] Hero section with animated dashboard mockup (Framer Motion floating cards)
- [x] Live stats ticker ("RM 47,382 earned today" with count-up)
- [x] Social proof band (creator logos + testimonials)
- [x] Feature showcase with scroll animations (3 sections: Trend Spy, AI Content, Analytics)
- [x] Pricing preview (Free/Pro/Business/Enterprise)
- [x] Trust badges (SSL, Shopee Partner, GDPR, Bank-grade Encryption)
- [x] Punchier copy: "The Only AI-Powered Platform Built Exclusively for Malaysian Shopee Affiliates"
- [x] Pre-auth marketing site; login moved to dedicated section (with smooth-scroll target)
- [x] 60-second demo video placeholder (Dialog modal)
- [x] Dark mode aware + responsive mobile-first
- [x] NO indigo or blue colors in design palette (only brand-icon blues for Google/Facebook OAuth buttons, which are unavoidable external branding)
- [x] All existing login functionality preserved (NextAuth credentials, demo login enhanced with one-click button, register link, OAuth providers)
