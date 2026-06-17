import { NextResponse } from 'next/server'
import { MOCK_ANALYTICS, MOCK_SESSIONS } from '@/lib/live/mock-data'
import type { LiveAnalytics } from '@/lib/live/types'

// ─── GET /api/live/analytics?sessionId=xxx ──────────────────────────────────
// Returns mock analytics for a given live session.
// If sessionId is omitted, returns analytics for all completed/live sessions.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const analytics = MOCK_ANALYTICS[sessionId]
      if (!analytics) {
        // Session exists in store but no analytics — generate an empty shell
        const session = MOCK_SESSIONS.find((s) => s.id === sessionId)
        if (!session) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          )
        }
        // Build a placeholder analytics object so the client can render
        const placeholder: LiveAnalytics = {
          sessionId,
          viewers: session.viewerCount ?? 0,
          peakViewers: session.peakViewerCount ?? 0,
          avgViewDurationSec: 0,
          clicks: 0,
          conversions: 0,
          conversionRate: 0,
          earnings: session.actualEarnings ?? 0,
          potentialCommission: session.potentialEarnings,
          topProducts: [],
          viewerTimeline: [],
          funnel: { impressions: 0, clicks: 0, addToCart: 0, purchases: 0 },
          earningsBreakdown: {
            baseCommission: 0,
            liveBonus: 0,
            total: session.actualEarnings ?? 0,
          },
        }
        return NextResponse.json({ analytics: placeholder })
      }
      return NextResponse.json({ analytics })
    }

    // No sessionId — return all analytics keyed by sessionId
    return NextResponse.json({
      analytics: MOCK_ANALYTICS,
      sessionIds: Object.keys(MOCK_ANALYTICS),
    })
  } catch (error) {
    console.error('GET /api/live/analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live analytics' },
      { status: 500 }
    )
  }
}
