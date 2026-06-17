import { NextResponse } from 'next/server'

import type { UsageAnalyticsResponse } from '@/lib/apikeys/types'
import { MOCK_USAGE_ANALYTICS } from '@/lib/apikeys/mock-data'

/**
 * GET /api/apikeys/usage
 *
 * Returns aggregated API usage analytics for the authenticated user:
 *   - 30-day combined timeseries (one point per day)
 *   - per-endpoint breakdown (calls / errors / latency)
 *   - per-key breakdown
 *   - error-rate trend (line chart)
 *   - latency distribution (bar chart)
 *
 * All response shapes include `source: 'mock'` per spec.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const body: UsageAnalyticsResponse = {
      analytics: MOCK_USAGE_ANALYTICS,
      source: 'mock',
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/apikeys/usage] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch usage analytics.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
