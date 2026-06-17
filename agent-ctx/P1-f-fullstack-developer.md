---
Task ID: P1-f
Agent: full-stack-developer (Sidebar Restructure)
Task: Restructure sidebar into collapsible sections (CORE/AI POWERED/PLATFORMS/ADVANCED/GROWTH), add favorites/pinned section, search bar, and keyboard shortcuts hook.

Work Log:
- Read worklog.md (tail), POLISH.md P1-f section, src/components/layout/sidebar.tsx (251 lines, original), src/store/app-store.ts (PageId type = 36 pages).
- Confirmed sidebar.tsx was the only consumer of the local `navItems` array — no other file imports it, so a full rewrite is safe.
- Reviewed existing shadcn components available: collapsible, dialog, input, badge, button, separator, avatar.
- Reviewed eslint.config.mjs — most rules off, but `react-hooks/set-state-in-effect` and `react-hooks/refs` ARE enforced (these are Next.js 16 / React 19 compiler rules).

Created `/home/z/my-project/src/hooks/use-keyboard-shortcuts.ts` (172 lines):
- `useKeyboardShortcuts(callbacks)` hook with a typed `KeyboardShortcutCallbacks` map.
- Single-key shortcuts: `/` (focus search), `?` (show help), `c` (create link), `Escape` (close overlay).
- Two-key combos with 700ms window: `g`+`d|p|l|a|e|c|t|h` → navigate to Dashboard/Products/Links/Analytics/Earnings/AI Content/Trend Spy/HERMES.
- Ignores modifier chords (Ctrl/Cmd/Alt) so native browser shortcuts aren't hijacked.
- Ignores key presses inside INPUT/TEXTAREA/SELECT/contentEditable/role="textbox" — except Escape which always fires.
- Latest-callback ref pattern (`cbRef.current = callbacks` inside `useEffect`, not during render) to satisfy the `react-hooks/refs` lint rule.

Rewrote `/home/z/my-project/src/components/layout/sidebar.tsx` (945 lines, up from 251):

Section structure (5 collapsible + dynamic Pinned):
  - 📌 Pinned (dynamic, only renders when user has pinned items)
  - 📊 Core (7 items, default-open): Dashboard, Products, Links, Analytics, Calculator, Campaigns, Earnings
  - 🤖 AI Powered (11 items, default-open): AI Content, Trend Spy, Profit Optimizer, Content Studio, Product Matcher, AI Recommender, AI Thumbnails, AI Calendar, Hashtag AI, Audience AI, A/B Testing
  - 🛒 Platforms (5 items, default-collapsed): TikTok Shop [NEW], Lazada [NEW], Shopee Live, Unified Earnings, Compare
  - ⚙️ Advanced (7 items, default-collapsed): Auto Post [NEW], XTRA Alerts, Pricing [PRO], Marketplace [NEW], Team Dashboard [NEW], White-Label [ENT], API Keys [API]
    (Note: XTRA Alerts was not listed in the task's section breakdown but is preserved from the original sidebar — placed in Advanced to keep all 36 nav items accessible.)
  - 🏆 Growth (6 items, default-collapsed): Leaderboard, Achievements, Referrals, Hermes AI Hub, Notifications, Settings

Section behavior:
  - Each section header has a chevron icon (rotates -90° when collapsed), title (uppercase 11px font-semibold muted-foreground), and item-count badge (tabular-nums).
  - Click header → toggles section. State persisted to `tvf_sidebar_sections` in localStorage.
  - Expand/collapse animated with Framer Motion AnimatePresence + height: 0 → height: 'auto' (200ms easeInOut, overflow hidden).
  - During search, all sections force-open and headers become non-interactive.

Pinned section:
  - Top of sidebar, only renders when `pinned.length > 0` AND not searching.
  - Header: Pin icon (amber-500) + "Pinned" label (amber-600 / amber-400 dark) + count.
  - Items appear in pinned order; each has a Pin indicator on the right.
  - Default on first run: Dashboard, AI Content, Earnings (DEFAULT_PINNED const).
  - State persisted to `tvf_pinned_pages`.

Star (pin/unpin) on every nav item:
  - Top-right of each item button, subtle.
  - Outline + opacity-0 by default; opacity-100 on `group-hover/nav`.
  - Filled amber-500 + always visible when item is pinned.
  - Click star → toggle pinned, stopPropagation so it doesn't navigate. Toast feedback "Pinned X" / "Unpinned X".

Search bar (top, below logo):
  - Input with Search icon (left), X clear button (right when query non-empty), `/` kbd hint (right when empty).
  - Placeholder: "Search pages… (or press /)".
  - Filters in real-time as user types — case-insensitive label match.
  - Empty result state: "No pages found. Try another search." with Search icon.
  - Pressing `/` anywhere (except inside text fields) focuses the search input. If sidebar is collapsed, expands it first then defers focus 60ms.

NEW badges with red pulsing dot:
  - Items with `isNew: true`: TikTok Shop, Lazada, Auto Post, Marketplace, Team Dashboard (5 items per task spec).
  - Red dot = `bg-red-500` with `animate-ping` overlay (dual-span pattern).
  - Click the item → marks as seen (adds to `tvf_seen_new_pages` in localStorage), red dot disappears.
  - When red dot is showing, the NEW badge is hidden to avoid redundancy.

Keyboard shortcuts help dialog:
  - Triggered by `?` key OR by the Command icon button next to Theme toggle (for discoverability).
  - Categorized table: Navigation (g+x combos), Actions (c, ?, Esc), Search (/).
  - "Got it" button (shopee-colored) to dismiss.
  - On first run only: auto-opens after 900ms if `tvf_shortcut_help_seen` is false; dismiss sets the flag.
  - State persisted to `tvf_shortcut_help_seen`.

Persistent state architecture:
  - All localStorage-backed state uses a custom `usePersistentState` hook built on `useSyncExternalStore` (inlined in sidebar.tsx).
  - This gives SSR-safe initial render (server snapshot = default), no `setState`-in-effect (avoids the cascading-render lint rule), and cross-tab sync via the native `storage` event.
  - Module-level `storageCache` Map ensures `getSnapshot` returns stable references for the same underlying localStorage value.
  - Same-window updates dispatch a custom `tvf-storage` event (the native `storage` event only fires for OTHER windows).

Toast feedback (sonner):
  - Navigation via shortcut or click → toast with destination label (1.2s, bottom-right).
  - Pin/unpin → toast "Pinned/Unpinned X" (1.2s, bottom-right).
  - Create Link shortcut → toast "Create Link — Affiliate Links" (1.4s, bottom-right).

Existing functionality preserved:
  - Active page highlighting (shopee color for non-special items, special color classes for color-tagged items — matches legacy behaviour).
  - Theme toggle (Moon/Sun, dark mode).
  - User section (Avatar, name, plan, Sign out / Sign in).
  - Collapse/expand sidebar button (ChevronLeft/Right, 64px ↔ 68px width).
  - When sidebar is collapsed: shows flat icon-only list (all 36 items, scrollable) with active highlight and red dots for unseen NEW items.
  - All 36 PageId values still navigable — no items removed.
  - Mobile: sidebar still `hidden lg:flex` (mobile uses MobileNav + MobileSheet, unchanged).

Color palette (NO indigo or blue):
  - Active item: `bg-shopee/10 text-shopee dark:bg-shopee/20 nav-glow`.
  - Pinned items: `bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300`.
  - Section headers: `text-muted-foreground uppercase text-[11px] font-semibold`.
  - Pinned section header: `text-amber-600 dark:text-amber-400`.
  - Red dot: `bg-red-500 animate-ping` (overlay) + `bg-red-500` (solid).
  - Help dialog primary button: `bg-shopee hover:bg-shopee-dark text-white`.

Stage Summary:
- Files created: 1 (`src/hooks/use-keyboard-shortcuts.ts`, 172 lines)
- Files modified: 1 (`src/components/layout/sidebar.tsx`, 251 → 945 lines)
- Lint: `bun run lint` → 0 errors, 0 warnings.
- Dev server: `GET / 200` confirmed after rewrite (no compile errors).
- All 36 nav items still accessible across 5 collapsible sections + dynamic Pinned section.
- Keyboard shortcuts hook wired up inside AppSidebar (hook file is reusable; could also be called from page.tsx if additional app-level shortcuts are needed — left as a follow-up per task scope).
- Power-user UX delivered: search bar with `/` focus, `g`+key navigation combos, `c` create link, `?` help overlay, star-to-pin, persistent state, smooth Framer Motion section animations.
