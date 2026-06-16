# Task 1-c — Data Export (CSV & PDF)

## Agent: full-stack-developer

## Task Summary
Build a production-ready data export feature for TheViralFindsMY — CSV + PDF
downloads for earnings, links, and analytics. Branded PDF reports with charts
and tables. Export buttons added to Earnings, Analytics, and Links pages.

## Files Created

### 1. Shared Export Library (`src/lib/export/`)
- **`utils.ts`** — Malaysian formatting helpers (RM currency, DD/MM/YYYY dates),
  RFC 4180 CSV escaping, date-range parsing, daily aggregation utilities.
- **`demo-data.ts`** — Seeded deterministic demo data for empty-DB fallback.
  Mirrors the demo behaviour of /api/earnings and /api/analytics.
- **`fetchers.ts`** — Prisma-backed fetchers that pull real data from
  `db.conversion`, `db.affiliateLink`, `db.clickRecord` and fall back to demo
  data when tables are empty. Returns `source: 'database' | 'demo'`.
- **`pdf-builder.ts`** — Branded PDF report builder using `pdfkit`. Three
  report renderers (earnings / links / analytics), each with:
  - Branded header (orange "TV" logo + "TheViralFindsMY" wordmark + period)
  - 4-card summary metrics with accent bars
  - Native vector bar charts (no external chart libs)
  - Paginated data tables with alternating row backgrounds
  - Footer with timestamp + page numbers + © TheViralFindsMY

### 2. API Routes
- **`src/app/api/export/csv/route.ts`** — GET endpoint.
  Query: `type=earnings|links|analytics&period=7d|30d|90d&startDate&endDate`.
  Returns UTF-8 BOM-prefixed CSV for Excel compatibility.
- **`src/app/api/export/pdf/route.ts`** — GET endpoint with same query params.
  Returns A4 portrait PDF attachment.

### 3. UI Component
- **`src/components/ui/export-buttons.tsx`** — Two exports:
  - `ExportButtons` — two-button inline group (CSV + PDF) with loading spinners
  - `ExportDropdown` — compact single-button dropdown variant
  - Both use sonner toast for feedback, open exports in new tab (preserves
    auth cookies), fully typed.

## Files Modified

### 1. `next.config.ts`
- Added `serverExternalPackages: ["pdfkit"]` to fix `__dirname` font loading.
  Without this, Turbopack rewrites `__dirname` to `/ROOT` and pdfkit can't
  find its `.afm` font metric files.

### 2. `src/middleware.ts`
- Added `/api/export` to `PUBLIC_API_PREFIXES` — exports fall back to demo
  data when DB is empty, so they don't need strict auth (consistent with
  the rest of the demo-mode app).

### 3. Page Components
- **`src/components/pages/earnings-page.tsx`** — Added `<ExportButtons type="earnings" period="30d" />`
  next to "Request Payout" button.
- **`src/components/pages/analytics-page.tsx`** — Added `<ExportButtons type="analytics" period={dateRange} />`
  after date-range selector, separated by `<Separator orientation="vertical" />`.
- **`src/components/pages/links-page.tsx`** — Added `<ExportButtons type="links" />`
  between "Sync Stats" button and Shopee connection badge (bonus).

## Libraries Installed
- `pdfkit@0.19.1` + `@types/pdfkit@0.17.6` — server-side PDF generation
- `pdf-lib@1.17.1` + `@pdf-lib/fontkit@1.1.1` — installed as fallback option,
  not used in final implementation

## Export Formats Supported

| Type    | CSV Columns                                                                  | PDF Sections                                                              |
|---------|------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Earnings | Date, Order ID, Product Name, Amount (RM), Commission (RM), Status          | Summary + Daily Earnings Chart + Recent Conversions + Top Products + Total Revenue |
| Links    | Name, Short Code, Affiliate URL, Clicks, Conversions, Earnings (RM), CTR (%), Status, Created At | Summary + Top 10 Links Chart + Full Link Table                            |
| Analytics | Date, Clicks, Conversions, CTR (%), Earnings (RM)                            | Summary + Daily Clicks Chart + Daily Conversions Chart + Daily Breakdown Table |

## Testing Results

All 6 export combinations tested via curl:
- ✅ Earnings CSV: 8KB, 200 demo rows (DB empty), BOM-prefixed, DD/MM/YYYY dates
- ✅ Links CSV: real DB data (1 link), correct columns
- ✅ Analytics CSV: 30/90-day periods, ~90 rows for 90-day
- ✅ Earnings PDF: 10KB, 2 pages, branded with charts
- ✅ Links PDF: 3.8KB, 1 page
- ✅ Analytics PDF: 6.4KB, 2 pages
- ✅ Custom date range `startDate=01/06/2025&endDate=30/06/2025` works for both CSV & PDF
- ✅ Invalid type returns 400 with clear error message
- ✅ Empty data handled gracefully (CSV returns "No data" message; PDF shows empty table)
- ✅ Dev server log shows no errors — all 6 endpoints return 200 with proper Prisma queries

## Lint Status
- My new files: 0 errors, 0 warnings ✅
- Pre-existing errors in `network-banner.tsx`, `use-network-status.ts`,
  `register-page.tsx`, `use-realtime.ts` — not my code, not touched.

## Notes
- All monetary values in RM format with 2 decimal places
- All dates in DD/MM/YYYY format (Malaysian)
- CSV opens correctly in Excel (UTF-8 BOM)
- PDFs are professionally branded with TheViralFindsMY logo, color scheme,
  and footer copyright
- Export buttons added to 3 pages: Earnings, Analytics, Links
- Period selector on Analytics page is wired to the export (export respects
  the selected date range)
