# Task 4-D — Fasa 4.4 White-Label Option

**Agent:** full-stack-developer
**Task:** Fasa 4.4 White-Label Option (6 subtasks)
**Status:** ✅ Complete

## Files Created / Modified

### Created (5 new files)
1. `src/lib/whitelabel/types.ts` (~250 lines) — Type definitions: `WhiteLabelConfig`, `BrandColors`, `CustomDomain`, `EmailTemplate`, `WhiteLabelPlan`, `DomainStatus`, `WhiteLabelStatus`, response envelopes, plus `COLOR_PRESETS` (6 palettes: shopee orange, hermes purple, emerald, rose, amber, teal — NO blue/indigo) and `DEFAULT_WHITELABEL_CONFIG`.
2. `src/lib/whitelabel/mock-data.ts` (~210 lines) — 5 enterprise tenants: ShopHijau (emerald, .my), AffiliatePro MY (purple, .my), Kedai Viral (amber, .com.my), TrendingAsia (dark, .sg), Boost Affiliate (teal, suspended). Helpers `getConfigByOrgId()`, `getCurrentConfig()`.
3. `src/lib/whitelabel/applier.ts` (~280 lines) — Pure functions: `applyBranding`, `getThemeOverride`, `validateDomain`, `describeDomainError`, `previewBranding`, `mergeWithDefaults`, plus colour helpers (`isValidHex`, `normalizeHex`, `hexToRgb`, `hexToRgba`, `relativeLuminance`, `contrastingForeground`).
4. `src/app/api/whitelabel/config/route.ts` (~205 lines) — GET (current org), GET ?list=1 (super-admin), POST (create/update with domain validation + auto-status-transition).
5. `src/app/api/whitelabel/preview/route.ts` (~135 lines) — POST handler returning `WhiteLabelPreviewData` with 3 rotating Malaysian sample products (Baju Kurung Moden, Tudung Bawal Premium, Kopi Susu Tambun).

### Overwritten (1 existing file — stub → full implementation)
6. `src/components/pages/whitelabel-page.tsx` (~900 lines, was 6-line ComingSoon stub) — Full admin panel.

## Mock White-Label Configs (5)

| # | Brand | Theme | Domain | Plan | Status |
|---|-------|-------|--------|------|--------|
| 1 | ShopHijau | Emerald green | affiliate.shophijau.my | enterprise | active (verified) |
| 2 | AffiliatePro MY | Hermes purple | app.affiliatepro.my | enterprise | active (verified) |
| 3 | Kedai Viral | Amber/orange | dashboard.kedaiviral.com.my | agency | pending |
| 4 | TrendingAsia | Dark/zinc | app.trendingasia.sg | enterprise | active (verified) |
| 5 | Boost Affiliate | Teal | panel.boost-affiliate.com | reseller | suspended (failed DNS) |

ShopHijau is the "current org" the demo user is logged in as.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/whitelabel/config` | Current org's white-label config + `source: 'mock'` |
| GET | `/api/whitelabel/config?list=1` | Super-admin list of all tenants |
| POST | `/api/whitelabel/config` | Create/update config (validates domain, auto-transitions status, persists to in-memory store) |
| POST | `/api/whitelabel/preview` | Build preview payload (CSS vars + theme overrides + sample dashboard) for any supplied config |

All responses include `source: 'mock'`. Auth: same NextAuth middleware pattern as all other `/api/*` routes (returns 401 without session cookie; SPA calls are authenticated via session cookie).

## Page UI Components Used

shadcn/ui: Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Input, Label, Skeleton, Separator, Tabs/TabsList/TabsTrigger/TabsContent, Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription/DialogFooter, Select/SelectTrigger/SelectContent/SelectItem/SelectValue, Table/TableHeader/TableBody/TableRow/TableCell/TableHead, Textarea.

TanStack Query: `useQuery` (config + list), `useMutation` (save with `invalidateQueries`).
Framer Motion: `motion.div`, `motion.button`, `motion.tr`, `AnimatePresence`, `layout` prop for smooth colour transitions.
sonner: `toast` for save/reset/edit/suspend notifications.

## Key Decisions

1. **Inline CSS vars (`--wl-*`) for branding** — applied as `style` on the preview wrapper only. Global theme (`globals.css`) untouched so the rest of the app is unaffected.
2. **Auto-contrast foreground** — `contrastingForeground()` picks white or near-black text on top of any brand colour via WCAG relative-luminance check, so the preview is always readable.
3. **Keyed remount for form state** — `WhiteLabelPage` (data fetching shell) renders `<WhiteLabelForm key={config.id + '-' + config.updatedAt} initialConfig={config} />`. The form uses `useState(initialConfig.xxx)` initialisers that run once per mount. When a save invalidates the query and the server returns a fresh snapshot, the key changes and the form remounts with the new values — no `useEffect`-based state syncing needed → satisfies the project's `react-hooks/set-state-in-effect` lint rule.
4. **Email template dialog keyed by open-counter** — drafts reset to the latest `templates` prop each time the user opens the dialog (no effect).
5. **Domain validation** — RFC-1034-ish with Malaysian TLD bias. Auto-transitions status: `not_configured` → `pending` when a domain is entered → (server-side DNS check would set) `verified` / `failed`. SSL status follows domain status.
6. **3 rotating Malaysian sample products** in the preview API — chosen deterministically by brand-name hash so each tenant sees a consistent-but-varied sample dashboard.
7. **Malaysian context throughout** — `.my` / `.com.my` domains, RM currency, Manglish email copy, Malaysian sample products.

## Verification

- ✅ My files pass `bunx eslint src/lib/whitelabel/ src/app/api/whitelabel/ src/components/pages/whitelabel-page.tsx` (0 errors).
- ⚠️ `bun run lint` shows 1 error in `src/components/pages/apikeys-page.tsx` (another agent's WIP — JSX parsing error in DialogHeader). NOT my file, did not modify per rules.
- ✅ `curl http://localhost:3000/` returns HTTP 200.
- ✅ API endpoints return 401 without auth (expected — same NextAuth middleware pattern as all other `/api/*` routes).

## Did NOT Modify (per rules)

- `prisma/schema.prisma` — kept the in-memory Map approach for the demo. Production would map to a `WhiteLabelConfig` Prisma model per CHECKLIST 4.4.1.
- `src/app/globals.css` — read for theme variables, no changes.
- `src/middleware.ts`, `src/app/page.tsx`, `src/store/app-store.ts`, sidebar — shared, no changes.
- Other agents' library files.
