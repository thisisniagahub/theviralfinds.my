# P2-d — HERMES AI Character & Chat Widget

**Agent:** full-stack-developer
**Task:** Build floating HERMES chat widget with mascot, quick prompts, Manglish personality, milestone reactions, "HERMES is thinking..." loading states, and persistent chat history.

## Work Log

### Step 1: Context gathering
- Read `/home/z/my-project/worklog.md` (last 250 lines) — reviewed prior agents' work and the `react-hooks/set-state-in-effect` lint pattern (queueMicrotask / ref pattern).
- Read `/home/z/my-project/POLISH.md` — confirmed Wave 2 P2-d scope.
- Read `/home/z/my-project/src/app/page.tsx` — found existing mobile FAB (lines 270-281) which I replaced with the new chat widget.
- Read `/home/z/my-project/src/app/api/hermes/chat/route.ts` — confirmed `POST /api/hermes/chat` with `{ message, conversationId? }` payload, returns `{ id, conversationId, role, content, createdAt }`.
- Read `src/lib/validation.ts` — confirmed `hermesChatSchema = z.object({ message, conversationId? })`.
- Read `src/store/app-store.ts` — `useAppStore` provides `activePage`, `setActivePage` (used for contextual hints + caption navigation).
- Read `src/components/pages/hermes-page.tsx` (first 200 lines) — confirmed existing hub's mascot style, typing-dot CSS classes, hermes/shopee color usage; did NOT modify.
- Read `src/app/globals.css` — confirmed `.typing-dot`, `.custom-scrollbar`, `.no-scrollbar-mobile`, `.safe-area-inset-bottom` utility classes are already defined; reused them.
- Verified color tokens: `--hermes: oklch(0.55 0.18 280)`, `--hermes-dark`, `--shopee`. NO indigo/blue used.

### Step 2: Created `src/components/hermes/hermes-mascot.tsx` (~7.6KB)
- Animated SVG robot/owl character: head with antenna + glowing bulb, two blinking eyes with pupils + shine, mouth (4 expression variants), body with HERMES "H" logo, two orange side-ears, tiny feet.
- Framer Motion animations:
  - Idle bobbing: `y: [0, -2, 0]` 2s loop.
  - Eye blink: `ry: [eye.ry, eye.ry, 0.4, eye.ry, eye.ry]` with 4s repeatDelay (0.18s blink).
  - Antenna glow halo: opacity + scale pulse 1.6s loop.
  - Antenna bulb: scale pulse 1.6s loop with drop-shadow.
  - Mouth path: `pathLength` 0→1 on mount.
- 4 sizes: sm (32px), md (48px), lg (96px), xl (160px).
- 4 expressions: happy (cheeks, smile), thinking (squint, looking up, flat mouth), excited (wide eyes, big smile), neutral.
- `animate` prop allows disabling animations (used for static avatars in messages + header).
- Uses CSS variables `var(--hermes)`, `var(--hermes-dark)`, `var(--shopee)` for theme-aware gradients.
- Pure SVG, no external assets, SSR-safe.

### Step 3: Created `src/components/hermes/hermes-reactions.tsx` (~8.5KB)
- Milestone reaction system listening to 4 custom DOM events:
  - `hermes:milestone` → "Wah, RM 1,000 already! 🔥 Keep going, you memang power!"
  - `hermes:first-link` → "Your first affiliate link! Memang power 🎉 Now let's make it viral."
  - `hermes:streak` → "7-day streak! You're on fire 🔥 Stay consistent, results confirm come!"
  - `hermes:high-conversion` → "23% conversion rate? Best gila! 🚀 You're in the top 1% of affiliates!"
- Each reaction renders as a custom toast (top-left, z-90) with:
  - HERMES mascot avatar (sm, expression varies per type).
  - Title + message + Sparkles icon + "HERMES AI" label.
  - Top gradient stripe (hermes → shopee).
  - "Chat with HERMES" button → dispatches `hermes:open-chat-with-message` event with `followUp` payload.
  - "Dismiss" button.
  - Auto-dismiss after 5s (configurable via `duration`).
  - Framer Motion spring entrance (x: 60 → 0, scale 0.9 → 1).
  - Stacks vertically with `AnimatePresence mode="popLayout"`.
- Exports `triggerHermesReaction(type, payload?)` helper for other pages to fire reactions.
- Exports `HermesReactionType` and `HermesReactionPayload` types.
- Position: `fixed top-4 left-4` (avoids overlap with sonner toaster at top-right and chat button at bottom-right).

### Step 4: Created `src/components/hermes/chat-widget.tsx` (~37KB)
- Floating button bottom-right: `fixed bottom-20 right-4 lg:bottom-6 z-50`, 56×56px purple circle with `Bot` icon (or `X` when open).
- Pulse animation on first visit (8s) — tracked via `tvf_hermes_first_visit_pulse_done` localStorage.
- Unread badge: red dot with count (top-right of button), increments when HERMES responds while widget is closed.
- Chat panel: 360px wide (mobile: `calc(100vw-2rem)`), 540px tall (mobile: `max-h-[calc(100vh-7rem)]`), slides in via Framer Motion spring.
- Header (purple gradient): HERMES mascot (sm) + "HERMES AI" title + "Online • Replies fast" status with pulsing green dot + clear-chat button (with confirmation popover) + close button.
- Messages area: scrollable with `custom-scrollbar`, 12px padding, message bubbles:
  - User: `bg-shopee text-white` right-aligned, "YOU" avatar.
  - HERMES: `bg-hermes/10 text-foreground` left-aligned, mascot avatar (sm, happy).
  - Light markdown rendering: `**bold**` and `*italic*` parsed inline, line breaks preserved.
  - Framer Motion entrance: opacity+y+scale.
- "HERMES is thinking..." indicator: 3 typing dots + italic text, mascot avatar (sm, thinking expression).
- Quick prompts (horizontally scrollable chips with `no-scrollbar-mobile`):
  1. "What should I promote today?" → canned response with top 3 trending MY products (wireless earbuds, sunscreen, tudung bawal) with prices, commission rates, sales volume, Manglish commentary.
  2. "Write me a caption" → canned Manglish caption template + navigates to AI Content page (`setActivePage('content')`) with toast.
  3. "Why did my conversions drop?" → canned analysis with 3 reasons (seasonal dip, stale content, broken links) + diagnostic flowchart.
  4. "Best time to post?" → canned time recommendations per platform (TikTok, Instagram, Shopee Live) with peak hours in MY time.
- Each quick prompt uses `handleSend(text, cannedResponse)` — displays user message, shows thinking indicator for 1.5s, then displays canned response.
- Input box: shopee-orange send button (disabled when empty/thinking), Enter to send. Voice input button (Mic icon) shows toast "Voice input coming soon 🎤" with description about Manglish voice training.
- Free-form messages call `POST /api/hermes/chat` with `Promise.all([apiCall, minDelay])` to ensure at least 1.5s perceived thinking time. 35% chance of prepending a random Manglish prefix ("Wah, good question!", "Steady lah", "Confirm best one", etc.) to add personality.
- Graceful API failure: catches errors and shows "Eh, my connection to the cloud gila slow right now 😅..." fallback message (important because the sandbox DB is read-only and `/api/hermes/chat` returns 500 on conversation creation).
- Mascot expression cycles: happy (default) → thinking (while loading) → excited (on response, 1.5s) → back to happy.
- Persistent chat history:
  - localStorage key: `tvf_hermes_chat_history`.
  - Max 50 messages (older trimmed on save).
  - Loaded on mount; if empty, seeds a Manglish welcome message.
  - "Clear chat" button shows confirmation popover, then resets to a fresh welcome message.
- Contextual hints (first visit per page):
  - Tracked via `tvf_hermes_seen_<pageId>` (open) and `tvf_hermes_dismissed_<pageId>` (dismiss).
  - Pages with hints: dashboard, products, links, content, trends, analytics.
  - Each hint has title, message, and introPrompt (auto-sent to chat when user clicks "Show me around").
  - Hint appears as small bubble above the floating button with mascot + dismiss (X) + "Show me around →" button + speech tail.
  - 1.2s delay after page change to avoid clashing with page transitions.
- External event listeners (registered once, use ref pattern for fresh `handleSend`):
  - `hermes:open-chat` → opens widget, clears unread.
  - `hermes:open-chat-with-message` → opens widget, sends the provided message after 400ms.
- Used `handleSendRef` (useRef + sync effect) to avoid stale closure — event listeners stay subscribed across re-renders.
- All localStorage access wrapped in try/catch for SSR safety.
- shadcn components used: `Button`, `Input`, `Tooltip` (+ Content/Provider/Trigger).
- lucide-react icons: `X, Send, Mic, Sparkles, Trash2, Lightbulb, TrendingUp, PenLine, AlertTriangle, Clock, Bot`.

### Step 5: Modified `src/app/page.tsx` (minimal, ~5 lines)
- Added imports: `HermesChatWidget` and `HermesReactions`.
- Removed the old mobile-only Floating Action Button (motion.button with Bot icon, `setActivePage('hermes')`) — replaced by the new chat widget which serves both mobile and desktop with a much richer experience.
- Rendered `<HermesReactions />` and `<HermesChatWidget />` after `<MobileNav />`, before `<OnboardingWizard />`.
- Did NOT touch: OnboardingWizard, sidebar, header, MobileSheet, MobileNav, or any page component.
- P1-b's onboarding wizard changes preserved.

### Step 6: Lint + verification
- First lint pass: 1 warning (unused eslint-disable in chat-widget.tsx) + 2 errors in `mobile-nav.tsx` and `mobile-sheet.tsx` (pre-existing from P2-c agent's set-state-in-effect pattern).
- Fixed my warning: removed the unused eslint-disable directive. Refactored event-listener effect to use `handleSendRef` (useRef synced via deps effect) instead of capturing `handleSend` in a stale closure — eliminates both the lint warning AND a real closure bug.
- Cleared eslint cache (`rm -rf node_modules/.cache/eslint`) — the mobile-nav/mobile-sheet errors were from a stale cache (those files already use the `queueMicrotask` pattern). Re-ran lint: **0 errors, 0 warnings, exit 0**.
- Dev server log confirms: `GET / 200` returns successfully, no compile errors after changes.
- Verified all 3 new files compile and the app renders.

## Stage Summary

### Files created
- `src/components/hermes/hermes-mascot.tsx` — 7.6KB, animated SVG mascot with 4 sizes + 4 expressions + idle/blink/glow animations.
- `src/components/hermes/hermes-reactions.tsx` — 8.5KB, milestone reaction system with 4 event types, custom toasts with mascot, Manglish messages, `triggerHermesReaction()` helper.
- `src/components/hermes/chat-widget.tsx` — 37KB, floating chat widget with mascot button, slide-in panel, quick prompts, thinking indicator, persistent history, contextual hints, voice input placeholder.

### Files modified
- `src/app/page.tsx` — added 2 imports, rendered `<HermesReactions />` + `<HermesChatWidget />` after `<MobileNav />`, removed redundant mobile FAB (replaced by chat widget).

### Files NOT modified (per spec)
- `src/components/pages/hermes-page.tsx` — existing hub left untouched.
- `src/components/pages/login-page.tsx`, `dashboard-page.tsx`, `trends-page.tsx`, `content-page.tsx` — untouched.
- `src/components/layout/sidebar.tsx`, `mobile-nav.tsx`, `mobile-sheet.tsx` — untouched.
- `src/components/onboarding/onboarding-wizard.tsx` — P1-b work preserved.
- No API routes modified — chat widget calls existing `POST /api/hermes/chat`.

### Lint status
**PASS** — `bun run lint` → 0 errors, 0 warnings, exit 0.

### Dev server status
Running cleanly on port 3000. `GET / 200` returns successfully. Note: `POST /api/hermes/chat` returns 500 in this sandbox because the SQLite DB is read-only (Prisma `ConnectorError: attempt to write a readonly database` on `hermesConnection.create`). My chat widget handles this gracefully via the try/catch fallback — users see "Eh, my connection to the cloud gila slow right now 😅..." instead of a crash. The 4 quick prompts work fully offline (canned responses, no API call).

### Key results
- HERMES now feels like a real character: bobbing mascot with blinking eyes + glowing antenna, Manglish personality throughout, contextual hints, milestone reactions, persistent memory across sessions.
- The widget is the single entry point for HERMES on mobile AND desktop (replaces the old mobile-only FAB).
- Reaction system is infrastructure-ready: any page can call `triggerHermesReaction('milestone', { message: 'RM 5,000!' })` to fire a celebratory toast.
- Color discipline maintained: `bg-hermes` (purple) for widget/button/HERMES bubbles, `bg-shopee` (orange) for user bubbles + accents. NO indigo/blue.
