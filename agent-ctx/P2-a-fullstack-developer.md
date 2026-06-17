# P2-a — Empty States System

**Agent**: full-stack-developer
**Task ID**: P2-a
**Wave**: 2 (System-Level Polish)
**Goal**: 4/10 → 10/10

## What was built

### 1. Custom SVG Illustrations Library
**File**: `src/components/illustrations/empty-illustrations.tsx` (NEW, ~470 lines)

8 on-brand illustrations, each ~80-120 lines of inline SVG with `currentColor` for
main shapes (so they adapt to dark mode via parent text color) and CSS variable fills
for background tint circles (orange `var(--shopee)` for engagement illustrations;
purple `var(--hermes)` for AI/locked/notification ones). NO indigo or blue.

| Key | Component | Description |
|---|---|---|
| `no-data` | `NoDataIllustration` | Empty 3D box (open flaps) with floating dots and sparkle |
| `no-api` | `NoApiIllustration` | Disconnected plug + socket with spark particles in the gap |
| `no-links` | `NoLinksIllustration` | Two separated chain links with a `?` between them |
| `no-campaigns` | `NoCampaignsIllustration` | Megaphone with radiating sound waves |
| `locked` | `LockedIllustration` | Padlock with keyhole + crown above (for locked achievements) |
| `no-results` | `NoResultsIllustration` | Magnifying glass with red X over a faded search list |
| `empty-feed` | `EmptyFeedIllustration` | Notification bell with floating "Z z z" text |
| `no-notifications` | `NoNotificationsIllustration` | Quiet phone with moon + stars |

Each illustration:
- 180x180 viewBox, accessible (`role="img"` + `aria-label`)
- Subtle continuous float animation via existing `.animate-float` CSS class with
  staggered `animationDelay` per element
- Accepts standard `SVGProps` (so `className`, `style`, `aria-*` work)
- Pure functions returning JSX (no `'use client'` directive — works in any context)

Also exports:
- `EmptyIllustrationKey` union type
- `ILLUSTRATION_COMPONENTS` registry (key → component)
- `ILLUSTRATION_LABELS` registry (key → aria-label)

### 2. New EmptyState Component
**File**: `src/components/ui/empty-state.tsx` (REWRITE, 75 → ~290 lines)

**New API** (recommended):
```tsx
<EmptyState
  illustration="no-campaigns"
  title="No campaigns yet"
  description="Launch your first campaign..."
  cta={{ label: "Launch your first campaign", icon: Rocket, onClick: openCreate }}
  exampleAction={{ label: "See example campaign", onClick: showExample }}
  compact={false}    // optional: smaller illustration + tighter padding
  unwrapped={false}  // optional: skip the Card wrapper (for embedding in Tables)
/>
```

**Legacy API** (preserved for backward compat with `alerts-page.tsx`):
```tsx
<EmptyState icon={ShoppingBag} title="..." description="..." action={<Button>...</Button>} />
```

Internally dispatches via `isLegacyProps` type guard. Legacy implementation is
unchanged (icon circle + dashed Card). New implementation uses Framer Motion:
- `useReducedMotion()` respected — falls back to opacity-only when reduced motion
- AnimatePresence wrapper keyed on `illustration + title` for mount/unmount transitions
- Staggered entrance: illustration (scale + fade, spring ease), then title (delay 0.15s), then description (delay 0.23s), then actions (delay 0.31s)
- Primary CTA: shopee-colored Button (`bg-shopee hover:bg-shopee-dark`) with ArrowRight icon that nudges on hover
- Example action: ghost Button with Sparkles icon (text-hermes color)
- Wrapped in dashed Card with subtle `from-transparent to-muted/30` gradient

### 3. Page Applications

#### `src/components/pages/campaigns-page.tsx`
- Added `EmptyState` (illustration=`no-campaigns`) shown when `campaigns.length === 0`
- CTA "Launch your first campaign" (Rocket icon) → opens existing create dialog
- Example "See example campaign" → opens new example dialog showing a mock campaign card (budget progress, links count, dates) with "Create my campaign" CTA
- Added `exampleOpen` state and example dialog at end of component
- Imports: `Rocket`, `Lightbulb` from lucide-react

#### `src/components/pages/links-page.tsx`
- Added `EmptyState` (illustration=`no-links`) shown when `links.length === 0` (replaces the entire table)
- CTA "Create your first link" (Plus icon) → opens existing create dialog
- Example "Watch 60s tutorial" → opens new tutorial modal placeholder:
  - Aspect-video player mockup with play button overlay
  - Brand gradient background (`from-shopee/20 via-hermes/15 to-shopee/10`)
  - Decorative timeline bar showing "0:15 / 1:00"
  - 3-step tutorial list with numbered shopee-colored badges
  - "Create my first link" CTA at bottom
- Added `tutorialOpen` state and tutorial dialog
- Action bar (Create button, search, filters) remains visible above the empty state

#### `src/components/pages/referrals-page.tsx`
- Added `EmptyState` (illustration=`no-data`) shown when `referrals.length === 0` in the lg:col-span-2 column
- CTA "Invite friends" (UserPlus icon) → copies referral link to clipboard; button label changes to "Link copied!" with Check icon for 2s
- Example "See success story" → opens new dialog showing:
  - Hero stat: "Total earned from 5 referrals: RM 1,025.70" with +18% trend badge
  - Mock referral list (4 people with avatars, status, monthly earnings)
  - "Invite my first friend" CTA at bottom
- "How It Works" panel (right column) stays visible alongside the empty state
- Added `successStoryOpen` state, `handleInviteFriends` helper, and success story dialog
- Imports: `Sparkles`, `TrendingUp` from lucide-react

#### `src/components/pages/achievements-page.tsx`
- Added a featured "Next Achievement to Unlock" banner between Overall Progress and Category Tabs
- Picks the locked achievement with the highest progress % (e.g. "Click Legend" at 3,240/10,000 = 32%)
- Layout: `md:grid-cols-[auto_1fr]` with EmptyState on the left and achievement preview on the right
- EmptyState (illustration=`locked`, compact, unwrapped):
  - Title: "Unlock this achievement"
  - Description: "Complete the requirement below to earn this badge and RM 10 bonus credit."
  - CTA "View requirement" (ChevronDown icon) → smooth-scrolls to that achievement's card in the grid below, then pulses a shopee-colored ring around it for 1.8s
  - Example "See unlocked examples" → opens new dialog showing 6 already-earned achievement cards in a 2-column grid (icon, title, description, earned date, +RM 10 credit)
- Achievement preview card (right side): lock icon, title, category badge, description, progress bar with current/max numbers, and a Target hint "Earn RM 10 bonus credit + badge when you reach X"
- Added `id="achievement-{id}"` to each achievement card motion.div so it can be scroll-targeted
- Added `examplesOpen` state, `nextAchievement` selector, `scrollToNextAchievement` helper, and examples dialog
- Imports: `Sparkles`, `ChevronDown`, `Dialog*`, `Button` from shadcn/lucide

#### `src/components/pages/marketplace-page.tsx`
- Removed the local `EmptyState` function (was 20 lines, used `Search` icon)
- Imported `EmptyState` from `@/components/ui/empty-state`
- Replaced usage at line 497 with the new API:
  - Illustration: `no-results`
  - Title: "No templates match your filters"
  - Description: "Try adjusting your search or browse popular categories instead."
  - CTA "Clear all filters" → calls existing `resetFilters()`
  - Example "Browse trending templates" → resets filters AND sets `sort: 'popular'` (the most "trending" sort option available)

## Color discipline
- Primary illustrations use `text-shopee` (orange) for engagement states (no-data, no-links, no-campaigns, no-results) and `text-hermes` (purple) for AI/locked/notification states (no-api, locked, empty-feed, no-notifications) — decided via `purpleIllustrations` array in `empty-state.tsx`
- Background tint circles use `fill="var(--shopee)"` / `fill="var(--hermes)"` at 6-8% opacity (verified to work via dashboard-page precedent using `stroke="var(--shopee)"`)
- Crown jewels and "X" badge on no-results use `var(--shopee)` for warm accent
- NO indigo or blue anywhere

## Files created
- `src/components/illustrations/empty-illustrations.tsx` (NEW, ~470 lines)
- `src/components/ui/empty-state.tsx` (REWRITE, 75 → ~290 lines)

## Files modified
- `src/components/pages/campaigns-page.tsx` (423 → ~542 lines)
- `src/components/pages/links-page.tsx` (1446 → ~1530 lines)
- `src/components/pages/referrals-page.tsx` (376 → ~490 lines)
- `src/components/pages/achievements-page.tsx` (367 → ~552 lines)
- `src/components/pages/marketplace-page.tsx` (2041 → ~2030 lines, net -11: removed local EmptyState, added new import + richer usage)

## Verification
- `bun run lint` → 0 errors, 0 warnings ✅
- `bunx tsc --noEmit --skipLibCheck` on my files → 0 errors ✅
- `curl http://localhost:3000/` → 200 OK ✅
- Legacy consumer (`alerts-page.tsx`) still compiles + lints clean ✅
- Dev server log shows no new errors from my modules ✅

## Design philosophy
Each empty state was written to feel like an OPPORTUNITY, not a failure:
- Empathetic headlines ("You haven't created any links yet" not "No data")
- Specific descriptions with concrete value props ("earn 20% of their subscription for 12 months")
- Primary CTA is action-oriented and uses a verb ("Launch", "Create", "Invite", "View", "Clear")
- "Show me an example" reduces the fear of the unknown by showing what success looks like
- Subtle floating animations + gradient backgrounds make the states feel alive, not abandoned
