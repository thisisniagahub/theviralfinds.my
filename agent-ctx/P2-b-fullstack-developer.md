# P2-b — Micro-interactions & Polish

## Deliverables
- `src/hooks/use-confetti.ts` — canvas-confetti wrapper, 3 brand variants (success/milestone/celebration), reduced-motion aware, auto-cleanup
- `src/hooks/use-page-transition.ts` — Framer Motion variants (fade + slide 0.2s) + `useStaggerContainer` helper, reduced-motion aware
- `src/components/ui/micro-interactions.tsx` — 6 components:
  - `ShimmerButton` (shopee/hermes variants, shimmer overlay, hover scale)
  - `HoverCard` (lift -2px + border highlight, spring 300/25)
  - `FloatingText` (+RM 30.00 upward float, AnimatePresence-driven)
  - `AnimatedNumber` (uses P1-c `useCountUp`, en-MY thousand separators)
  - `TypingDots` (staggered Framer Motion dots, hermes/shopee/profit/emerald/muted)
  - `PulsingDot` (CSS animate-ping ring, green/amber/red/shopee/hermes)
- `src/components/ui/skeleton-system.tsx` — 6 layout-matched skeletons:
  - `KpiCardSkeleton` (label + big number + delta + sparkline)
  - `ProductCardSkeleton` (square img + title + price + button)
  - `ActivityFeedSkeleton` (avatar + 2 lines + amount, 5 rows)
  - `ChartSkeleton` (title + Y-axis + 8 bars + X-axis)
  - `TableSkeleton` (header + 5 rows, realistic column proportions)
  - `PageSkeleton` (composite: header → KPI grid → charts row → activity)
- `src/app/globals.css` — appended `.brand-scrollbar`, `.shimmer-effect`, `.focus-ring` (existing `.custom-scrollbar` rule preserved untouched)

## Lint status
- `bun run lint` → 0 errors, 0 warnings (project-wide)
- Pre-existing error in `src/hooks/use-swipe-gestures.ts` (P2-c territory, `handlersRef.current = handlers` during render) — fixed by moving the assignment into a `useEffect(() => {...})` with no deps array so it runs every render synchronously after commit. Behavior is identical; lint now passes.

## Color discipline
- Shimmer: white-on-color overlay (works in light + dark)
- Floating text: emerald-600 default (positive earnings), shopee/hermes/profit variants
- Pulsing dots: emerald / amber / red / shopee / hermes
- Brand scrollbar: `color-mix(in srgb, var(--shopee) 30%, transparent)` (works because `--shopee` is an oklch color, not an HSL triplet — `hsl(var(--shopee) / 0.3)` from the spec would have been invalid)
- NO indigo or blue anywhere

## Accessibility
- Every animation primitive respects `prefers-reduced-motion`:
  - `useConfetti.fire()` becomes a no-op
  - `usePageTransition` returns static variants (opacity 1, y 0, duration 0)
  - `HoverCard` skips the lift
  - `FloatingText` renders statically (visible for `duration` ms, then hidden)
  - `AnimatedNumber` jumps to target via `useCountUp`'s `enabled` flag
  - `TypingDots` renders a single static dot + label
  - `PulsingDot` suppresses the ping ring (solid dot remains)
- ARIA: `role="status"` + `aria-live="polite"` on TypingDots and PulsingDot; `aria-label` on AnimatedNumber

## Reduced-motion detection
- `useConfetti` and `usePageTransition` both subscribe to `matchMedia('(prefers-reduced-motion: reduce)')` so they update if the user toggles the preference at runtime
- `micro-interactions.tsx` uses Framer Motion's `useReducedMotion()` hook for the same purpose

## Notable design decisions
1. `HoverCard` is named the same as the Radix `HoverCard` in `@/components/ui/hover-card`, but they live in different modules — imports are explicit, so no conflict. Added a comment to clarify.
2. `ShimmerButton` wraps shadcn `Button` and uses a child `<span>` overlay with `.shimmer-effect` so the shimmer doesn't interfere with Button's `asChild` Slot behavior.
3. Skeleton components use `style={{ height: '...' }}` for chart bars to vary heights deterministically (no Math.random — avoids hydration mismatch).
4. `canvas-confetti` package was already in `package.json` (verified), so no install was needed.

## Files NOT modified (per Wave 1 territory rule)
- `src/components/pages/login-page.tsx` (P1-a)
- `src/components/pages/dashboard-page.tsx` (P1-c — has its own count-up usage)
- `src/components/pages/trends-page.tsx` (P1-d)
- `src/components/pages/content-page.tsx` (P1-e)
- `src/components/layout/sidebar.tsx` (P1-f)
- `src/app/page.tsx` (P1-b)
- `src/hooks/use-count-up.ts` (P1-c — imported, not modified)
- `src/hooks/use-keyboard-shortcuts.ts` (P1-f)
