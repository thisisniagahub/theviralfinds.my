/**
 * GET  /api/hermes/insights
 *   Returns a list of proactive insights, sorted by severity + relevance + recency.
 *   Optional `?type=daily_summary|anomaly|opportunity|trend_alert|recommendation`
 *   filter. Always includes a `source` field on every insight.
 *
 *   Strategy:
 *     1. Try DB (HermesInsight table) — these are AI-generated insights persisted
 *        on previous `/generate` calls.
 *     2. Always merge in the algorithmic mock dataset so the UI has content even
 *        on first load.
 *     3. Re-score relevance against a default user profile.
 *     4. Filter + sort + return.
 *
 *   Response shape: InsightsListResponse (see src/lib/hermes-insights/types.ts)
 *
 * POST /api/hermes/insights
 *   Marks an insight as actioned (or read). Body: { id, action: 'actioned' | 'read' }
 *   For mock insights (id starts with "mock-"), we keep the state in-memory
 *   (no DB record to update). For DB-backed insights, we update HermesInsight row.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  MOCK_INSIGHTS,
} from '@/lib/hermes-insights/mock-data'
import {
  filterAndSort,
  countNew,
  scoreInsightRelevance,
} from '@/lib/hermes-insights/generator'
import type {
  ProactiveInsight,
  InsightType,
  InsightTypeFilter,
  InsightsListResponse,
  UserProfile,
} from '@/lib/hermes-insights/types'

// In-memory actioned state for mock insights (resets on server restart).
// DB-backed insights persist their actioned state in the HermesInsight table.
const mockActionedState = new Map<string, { isRead: boolean; isActioned: boolean }>()

// Default user profile — until auth + real profile data lands, use sensible
// Malaysian defaults so the relevance scoring is meaningful.
const DEFAULT_USER_PROFILE: UserProfile = {
  topCategories: ['Beauty', 'Fashion', 'Electronics'],
  hasShopeeApi: false,
  avgDailyClicks: 200,
  peakHour: 20, // 8 PM MYT
  accountAgeDays: 45,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Validate that a string is a known InsightType (or 'all'). */
function isValidTypeFilter(value: string | null): value is InsightTypeFilter {
  if (value === 'all') return true
  return [
    'daily_summary',
    'anomaly',
    'opportunity',
    'trend_alert',
    'recommendation',
  ].includes(value)
}

/** Convert a DB HermesInsight row → ProactiveInsight. */
function dbRowToInsight(row: {
  id: string
  type: string
  title: string
  description: string
  severity: string
  data: string | null
  isRead: boolean
  isActioned: boolean
  createdAt: Date
}): ProactiveInsight {
  // Map DB severity → our InsightSeverity (DB only knows info|warning|critical,
  // so we promote positive news via 'success' when type implies it).
  const severity = (['info', 'warning', 'critical', 'success'].includes(row.severity)
    ? row.severity
    : 'info') as ProactiveInsight['severity']

  // Map DB type string → our InsightType. Old rows used 'trend'/'alert' —
  // normalise them onto our new vocabulary.
  const typeMap: Record<string, InsightType> = {
    trend: 'trend_alert',
    alert: 'anomaly',
    opportunity: 'opportunity',
    recommendation: 'recommendation',
    daily_summary: 'daily_summary',
    anomaly: 'anomaly',
    trend_alert: 'trend_alert',
  }
  const type = typeMap[row.type] ?? 'recommendation'

  let parsedData: ProactiveInsight['data'] = undefined
  if (row.data) {
    try {
      parsedData = JSON.parse(row.data)
    } catch {
      // ignore malformed JSON
    }
  }

  return {
    id: row.id,
    type,
    severity,
    title: row.title,
    description: row.description,
    timestamp: row.createdAt.toISOString(),
    relevance: 75, // will be re-scored below
    isRead: row.isRead,
    isActioned: row.isActioned,
    source: 'ai',
    data: parsedData,
    secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
  }
}

/** Apply in-memory actioned state to mock insights. */
function applyMockState(insight: ProactiveInsight): ProactiveInsight {
  const state = mockActionedState.get(insight.id)
  if (!state) return insight
  return { ...insight, isRead: state.isRead, isActioned: state.isActioned }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')
    const typeFilter: InsightTypeFilter = isValidTypeFilter(typeParam)
      ? typeParam
      : 'all'

    // 1. Load DB-backed AI insights (if any)
    let dbInsights: ProactiveInsight[] = []
    try {
      const rows = await db.hermesInsight.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
      dbInsights = rows.map(dbRowToInsight)
    } catch (dbErr) {
      // DB might not be initialised in some dev environments — fail soft.
      console.warn('[hermes/insights] DB read failed, using mock only:', dbErr)
    }

    // 2. Merge with mock dataset (apply in-memory actioned state)
    const mockWithState = MOCK_INSIGHTS.map(applyMockState)

    // 3. Combine — DB insights first, then mock (dedup by title to avoid noise)
    const seenTitles = new Set<string>()
    const combined: ProactiveInsight[] = []
    for (const insight of [...dbInsights, ...mockWithState]) {
      const key = insight.title.toLowerCase().slice(0, 60)
      if (seenTitles.has(key)) continue
      seenTitles.add(key)
      combined.push(insight)
    }

    // 4. Re-score relevance against the default user profile
    const scored = combined.map((i) => ({
      ...i,
      relevance: scoreInsightRelevance(i, DEFAULT_USER_PROFILE),
    }))

    // 5. Filter + sort
    const finalInsights = filterAndSort(scored, typeFilter)

    // 6. Determine overall response source
    const hasDb = dbInsights.length > 0
    const hasMock = mockWithState.length > 0
    const responseSource: InsightsListResponse['source'] = hasDb && hasMock
      ? 'mixed'
      : hasDb
        ? 'ai'
        : 'mock'

    const responseBody: InsightsListResponse = {
      insights: finalInsights,
      count: finalInsights.length,
      newCount: countNew(finalInsights),
      generatedAt: new Date().toISOString(),
      source: responseSource,
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('[hermes/insights] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch insights',
        insights: [],
        count: 0,
        newCount: 0,
        generatedAt: new Date().toISOString(),
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

// ─── POST (mark as actioned / read) ──────────────────────────────────────────

interface MarkActionedBody {
  id?: string
  action?: 'actioned' | 'read'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as MarkActionedBody
    const { id, action = 'actioned' } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 },
      )
    }

    if (action !== 'actioned' && action !== 'read') {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Must be 'actioned' or 'read'.` },
        { status: 400 },
      )
    }

    // Mock insight → update in-memory state
    if (id.startsWith('mock-') || id.startsWith('daily-') ||
        id.startsWith('anom-') || id.startsWith('opp-') ||
        id.startsWith('trend-') || id.startsWith('rec-')) {
      const current = mockActionedState.get(id) ?? { isRead: false, isActioned: false }
      const next = action === 'actioned'
        ? { isRead: true, isActioned: true }
        : { ...current, isRead: true }
      mockActionedState.set(id, next)
      return NextResponse.json({
        ok: true,
        id,
        action,
        state: next,
        source: 'mock',
      })
    }

    // DB-backed insight → update HermesInsight row
    try {
      const updateData = action === 'actioned'
        ? { isActioned: true, isRead: true }
        : { isRead: true }

      const updated = await db.hermesInsight.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({
        ok: true,
        id,
        action,
        state: {
          isRead: updated.isRead,
          isActioned: updated.isActioned,
        },
        source: 'ai',
      })
    } catch (dbErr) {
      console.warn('[hermes/insights] DB update failed, treating as mock:', dbErr)
      const current = mockActionedState.get(id) ?? { isRead: false, isActioned: false }
      const next = action === 'actioned'
        ? { isRead: true, isActioned: true }
        : { ...current, isRead: true }
      mockActionedState.set(id, next)
      return NextResponse.json({
        ok: true,
        id,
        action,
        state: next,
        source: 'mock',
      })
    }
  } catch (error) {
    console.error('[hermes/insights] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 },
    )
  }
}
