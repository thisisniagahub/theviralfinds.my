import { NextRequest, NextResponse } from 'next/server'

import {
  DEFAULT_ALERT_PREFERENCES,
  type AlertNiche,
  type CommissionAlert,
  type XtraAlertActionRequest,
  type XtraAlertActionResponse,
  type XtraAlertsResponse,
} from '@/lib/alerts/types'
import {
  LAST_CHECKED_AT,
  MOCK_XTRA_PRODUCTS,
  getActiveXtraProducts,
} from '@/lib/alerts/mock-data'
import {
  buildAlertFeedForUser,
  computePotentialExtraEarnings,
  countMatchedAlerts,
  matchAlertToUser,
} from '@/lib/alerts/matcher'

/**
 * In-memory store of per-alert user state (read / dismissed / snoozed).
 *
 * In production this would live in the `CommissionAlert` Prisma model
 * (CHECKLIST 3.3.1). For Fasa 3.3 we keep it in module scope so the state
 * round-trips between GET (read) and POST (write) within the same dev server
 * process.
 */
interface AlertState {
  read: boolean
  dismissed: boolean
  snoozedUntil: string | null
}

const alertState = new Map<string, AlertState>()

function getAlertState(id: string): AlertState {
  if (!alertState.has(id)) {
    alertState.set(id, { read: false, dismissed: false, snoozedUntil: null })
  }
  return alertState.get(id)!
}

/** Validates the niche query param. Returns 'all' if missing or invalid. */
function parseNiche(value: string | null): AlertNiche | 'all' {
  if (!value || value === 'all') return 'all'
  const valid: AlertNiche[] = ['beauty', 'tech', 'fashion', 'home', 'food']
  return valid.includes(value as AlertNiche) ? (value as AlertNiche) : 'all'
}

/**
 * GET /api/alerts/xtra
 *
 * Returns the current Commission XTRA product feed, optionally filtered by
 * niche, plus the per-user alert state (read/dismissed/snoozed) so the UI
 * can render the alerts dashboard.
 *
 * Query params:
 *   - niche: beauty | tech | fashion | home | food | all (default)
 *
 * Always includes `source: 'mock'` per spec.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const niche = parseNiche(searchParams.get('niche'))

    // Get all currently-boosting XTRA products (expiresAt > now).
    const allActive = getActiveXtraProducts()

    // Filter by niche if requested.
    const filtered =
      niche === 'all'
        ? allActive
        : allActive.filter((p) => p.niche === niche)

    // Build the alert feed (scoring + preference filtering).
    // NOTE: For Fasa 3.3 we use the default preferences. Once the user
    // preferences API has stored state, this route will read from there.
    const preferences = DEFAULT_ALERT_PREFERENCES
    const feed = buildAlertFeedForUser(filtered, preferences)

    // Apply per-alert user state.
    const alerts: CommissionAlert[] = feed
      .map((a) => {
        const state = getAlertState(a.id)
        return {
          ...a,
          read: state.read,
          dismissed: state.dismissed,
          snoozedUntil: state.snoozedUntil,
        }
      })
      // Hide dismissed + snoozed alerts from the default feed.
      .filter((a) => {
        if (a.dismissed) return false
        if (a.snoozedUntil) {
          const until = new Date(a.snoozedUntil).getTime()
          if (until > Date.now()) return false
        }
        return true
      })

    // Aggregate stats.
    const matchedCount = countMatchedAlerts(alerts, preferences.minRelevanceScore)
    const avgBoostPercent =
      alerts.length === 0
        ? 0
        : Math.round(
            (alerts.reduce((sum, a) => sum + a.product.boostDelta, 0) / alerts.length) * 10,
          ) / 10
    const potentialExtraEarnings = Math.round(
      alerts.reduce((sum, a) => sum + a.potentialExtraEarnings, 0) * 100,
    ) / 100

    const body: XtraAlertsResponse = {
      alerts,
      products: filtered,
      totalActive: allActive.length,
      matchedCount,
      avgBoostPercent,
      potentialExtraEarnings,
      niche,
      source: 'mock',
      lastCheckedAt: LAST_CHECKED_AT,
    }

    return NextResponse.json(body, {
      headers: {
        // Short cache so the 30s polling always hits the server but CDN
        // edge caches don't pile on.
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('[GET /api/alerts/xtra] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch Commission XTRA alerts.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/alerts/xtra
 *
 * Body: { alertId: string, action: 'read' | 'dismiss' | 'snooze', snoozeMinutes?: number }
 *
 * Mutates the per-alert user state. Returns `{ success: true }` on success.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: XtraAlertActionRequest
    try {
      body = (await request.json()) as XtraAlertActionRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { alertId: string, action: "read" | "dismiss" | "snooze", snoozeMinutes?: number }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!body || !body.alertId || typeof body.alertId !== 'string') {
      return NextResponse.json(
        {
          error: 'Field "alertId" is required (string).',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!['read', 'dismiss', 'snooze'].includes(body.action)) {
      return NextResponse.json(
        {
          error: 'Field "action" must be one of: read, dismiss, snooze.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // Look up the underlying XTRA product so we can rebuild the alert.
    const product = MOCK_XTRA_PRODUCTS.find((p) => `alert-${p.id}` === body.alertId)
    if (!product) {
      return NextResponse.json(
        {
          error: `Alert "${body.alertId}" not found.`,
          source: 'mock' as const,
        },
        { status: 404 },
      )
    }

    const state = getAlertState(body.alertId)
    const now = Date.now()

    switch (body.action) {
      case 'read':
        state.read = true
        break
      case 'dismiss':
        state.dismissed = true
        state.read = true
        break
      case 'snooze': {
        const mins = body.snoozeMinutes && body.snoozeMinutes > 0 ? body.snoozeMinutes : 60
        state.snoozedUntil = new Date(now + mins * 60_000).toISOString()
        break
      }
    }

    const response: XtraAlertActionResponse = {
      success: true,
      alertId: body.alertId,
      action: body.action,
      source: 'mock',
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/alerts/xtra] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update alert state.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

// ─── Helper exports (used by tests / other routes) ────────────────────────

export { computePotentialExtraEarnings, matchAlertToUser }
