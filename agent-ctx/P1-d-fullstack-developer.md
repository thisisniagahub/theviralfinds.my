# Task ID: P1-d — Trend Spy Overhaul (6/10 → 10/10)

**Agent:** full-stack-developer (Trend Spy Overhaul)
**File:** `/home/z/my-project/src/components/pages/trends-page.tsx`
**Lines:** 1346 (rewrote from 210)

## What was built

### A. Heat Map View (`HeatMapCell` + grid)
- 12 categories per spec: Electronics, Beauty, Fashion, Home, Food, Baby, Sports, Gaming, Auto, Books, Health, Pets — each with emoji
- 4×3 grid on desktop (`md:grid-cols-4`), 3-col on small (`sm:grid-cols-3`), 2×6 on mobile (`grid-cols-2`)
- Color intensity = category's hottest product velocity:
  - `>= 60` → `bg-red-500` (Hot)
  - `40-59` → `bg-orange-500` (Hot)
  - `25-39` → `bg-amber-400` (Warm)
  - `10-24` → `bg-yellow-300` (Warm)
  - `< 10` → `bg-slate-300`/`bg-slate-700` dark (Cool)
- Click → sets `categoryFilter` (also toggles off if already active)
- Active cell gets ring + scale-105 highlight
- Legend at bottom: 🔥 Hot / 🌤️ Warm / ❄️ Cool with color swatches
- "Clear filter" button when filter active

### B. Three Tabs (replaced old Trending/Keywords/Competitors tabs)
1. **Trending Now** (Flame icon, red accent) — velocity > 50%, high momentum
2. **About to Blow Up** (Rocket icon, amber accent) — velocity 20-50%, low competition
3. **Steady Earners** (Crown icon, emerald accent) — high commission, stable velocity

Each tab description shown in filter bar. TabsList is `grid-cols-3 sm:flex` for mobile responsiveness. Animated transitions via `AnimatePresence mode="wait"` keyed on `tab + '-' + categoryFilter`.

### C. Product Card (rich data per product)
- Thumbnail: gradient-bg square with category emoji
- Bold green commission rate
- Velocity arrow: ↑ green / → slate / ↓ red with percentage
- 7-day sparkline (Recharts LineChart, 36px tall, no axes)
- Competition badge: 🟢 Low / 🟡 Medium / 🔴 High (color-coded bg + border)
- Price range + monthly search volume in footer
- Watch/Unwatch button in footer
- Bell icon (top-right) for alert dropdown
- Framer Motion stagger entrance (delay = index × 0.03, capped at 0.3s)
- Click card → opens product detail dialog

### D. Competitor Watch List (top section)
- "👀 Competitor Watch" header with amber gradient background
- 5 products with most competitors (`>= 3` threshold)
- Each shows: emoji, name, category, "N competitors promoting"
- Anonymous names: "Affiliate #2847", "Affiliate #1932", "Affiliate #4501", "Affiliate #3318", "Affiliate #5520", "Affiliate #6712"
- "Watch this product" button → toggles localStorage watch list
- Responsive: 1/2/3/5 columns

### E. Alert System
**Per-card alert dropdown** (Bell icon → DropdownMenu):
1. "Notify me when commission increases" (commission_increase)
2. "Daily trending digest at 9 AM" (daily_digest)
3. "Push notification for sudden spikes" (spike_push)

Each item shows icon + label + description. Click → creates AlertItem + toast "Alert created".

**Manage Alerts modal** (button in header with red count badge):
- Lists all active alerts with icon, label, product name
- Switch toggle to enable/disable
- Trash button to delete
- Empty state with bell icon + hint text
- Persists to localStorage

### F. Product Detail Dialog (click any card)
- Header: large emoji, name, category, price range, search volume
- 3 badges: competition level, velocity direction, commission rate
- "Why it's trending" amber callout box
- **Seasonal indicator** with 📈 Target icon: e.g. "Year-round — peaks during 11.11 & 12.12 mega sales"
- **Commission rate history** — Recharts LineChart (7-day, emerald line)
- **Search volume trend** — Recharts BarChart (7-day, amber bars)
- **Competition analysis** text — dynamic based on level (e.g. "🟢 Low competition — only 8 affiliates are promoting this product right now. First-mover advantage is significant.")
- Anonymous competitors list (badges)
- **Related products carousel** — horizontal scroll of same-category products, click to switch
- Two CTAs: "Generate Affiliate Link" (outline) + "Create AI Content" (amber, with Wand2 icon)

## Mock Data
**24 products** across all 12 categories (2 per category), realistic Malaysian names:
- Xiaomi Robot Vacuum Mop 2 Pro, Anker Soundcore TWS Earbuds Life Note 3
- Safi Balqis UV Sunblock SPF50, Cushion Foundation Matte Halal Wardah
- Tudung Bawal Premium Cotton Instant, Baju Kurung Moden Raya 2025 Pastel
- Instant Pot Duo 7-in-1, Portable Blender USB Rechargeable
- Kopi Susu Tambun 3-in-1, Mamee Chef Curgy Mi Instant Noodles
- MamyPoko Pants Standard, Philips Avent Natural Baby Bottle
- Yoga Mat Anti-Slip TPE, Adjustable Dumbbell 24kg Pair
- RGB Mechanical Keyboard, Nintendo Switch OLED Restock Bundle
- Magnetic Car Phone Holder, Dashcam 4K Front Rear Dual Camera
- Atomic Habits Malay Edition, Career Reset Starter Pack Bundle
- Blackmores Vitamin C 1000mg, Omega-3 Fish Oil Triple Strength
- Smart Pet Feeder WiFi Camera, Premium Cat Food Grain-Free Salmon

Each product has full rich data: `commissionRate`, `velocity`, `velocityDir`, `competition`, `competitorCount`, `sparkline7d[]`, `commissionHistory[{day,rate}]`, `searchVolume7d[{day,vol}]`, `season`, `whyTrending`, `priceRange`, `monthlySearch`, `tab`, `competitors[]`.

## Technical decisions

### SSR-safe localStorage (lint-clean)
The project's lint rule `react-hooks/set-state-in-effect` blocks the common pattern of `useEffect(() => { setX(localStorage.getItem(...)) }, [])`. Solved with a **`useLocalStorageState<T>` helper** built on `useSyncExternalStore`:
- `subscribe` — listens to `storage` events filtered by key (cross-tab sync)
- `getSnapshot` — returns cached parsed value; re-parses only when underlying raw string changes (stable reference, no infinite loop)
- `getServerSnapshot` — returns frozen `EMPTY_*_ARRAY` module constant (SSR returns `[]`)
- `setValue` — writes to localStorage + updates cache + dispatches synthetic `StorageEvent` (same-window sets don't fire native storage events)
- Hydration-safe: server renders `[]`, client first render also returns `[]` (cache miss returns initial), then reads actual value via subscribe callback after mount

Used for both `watchList` (string[]) and `alerts` (AlertItem[]). Both persisted to `trends:watchlist` and `trends:alerts` keys.

### Color palette (NO indigo/blue primary)
- Hot: `bg-red-500`, `bg-orange-500`
- Warm: `bg-amber-400`, `bg-yellow-300`
- Cool: `bg-slate-300` / `bg-slate-700` (dark mode)
- Accent: amber-600 throughout (header icons, primary CTAs, heat ring)
- Competition: emerald/amber/red consistent with project palette
- Commission text: emerald-600 bold

### Responsive design
- Heat map: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`
- Competitor cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`
- Product grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Tab list: `grid-cols-3 sm:flex` (mobile shows first word only)
- Charts in dialog: `grid-cols-1 md:grid-cols-2`
- All touch targets ≥ 28px (h-7 buttons), primary buttons larger

### Accessibility
- `aria-label` on alert bell, delete buttons, clear-filter, clear-category
- `aria-pressed` on heat map cells
- Semantic HTML throughout (`<button>`, `<Card>`, `<Dialog>`)
- All interactive elements keyboard-accessible (shadcn primitives)
- `line-clamp-2` on long product names to prevent layout shift

## Files modified
| Path | Change |
|------|--------|
| `src/components/pages/trends-page.tsx` | Full rewrite (210 → 1346 lines) |

No new files created. No API changes — entirely client-side mock data with rich visualization. Existing `/api/trends/*` routes untouched.

## Lint status
**0 errors, 0 warnings** for `trends-page.tsx` (verified with `bun run lint`).

(Note: lint also reports pre-existing errors in `dashboard-page.tsx:422` and `sidebar.tsx:291` — those belong to other agents/tasks and were not introduced by P1-d.)

## Verification checklist
- [x] `bun run lint` passes (0 errors on trends-page.tsx)
- [x] All 3 tabs functional (Trending Now / About to Blow Up / Steady Earners)
- [x] Heat map renders with all 12 categories
- [x] Product detail dialog opens with commission LineChart + search volume BarChart
- [x] Alert dropdown creates alerts with toast
- [x] Manage Alerts modal shows active alerts with Switch + delete
- [x] Competitor Watch section shows 5 products with anonymous affiliate names
- [x] Responsive: mobile 2-col heat map, 1-col product grid; desktop 4×3 + 4-col grid
- [x] Watch list persists to localStorage (survives reload)
- [x] No indigo/blue primary colors used
- [x] Framer Motion: card stagger entrance, tab transitions, AnimatePresence
