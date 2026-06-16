import { NextRequest, NextResponse } from 'next/server'
import { buildUnifiedEarningsResponse } from '@/lib/earnings/mock-data'
import type { EarningsPeriod } from '@/lib/earnings/types'

/**
 * GET /api/earnings/unified
 *
 * Returns unified earnings across Shopee, TikTok Shop, and Lazada.
 *
 * Query params:
 *   - period: '30d' | '90d' | '12m' (default: '12m')
 *
 * Response shape (UnifiedEarningsResponse):
 *   - summary: { totalEarnings, totalClicks, totalConversions,
 *                avgConversionRate, platformCount, period }
 *   - byPlatform: PlatformEarning[]
 *   - breakdown: PlatformBreakdown[] (pie-chart data)
 *   - trend: EarningsTrendPoint[] (12 months of monthly data)
 *   - source: 'mock' | 'api'
 *   - period: requested period
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawPeriod = searchParams.get('period')

    // Validate period param — default to '12m'
    const VALID_PERIODS: EarningsPeriod[] = ['30d', '90d', '12m']
    const period: EarningsPeriod =
      rawPeriod && VALID_PERIODS.includes(rawPeriod as EarningsPeriod)
        ? (rawPeriod as EarningsPeriod)
        : '12m'

    // Always mock for now — real per-platform API aggregation will be wired
    // up in a later Fasa. The 'source' field lets the client distinguish.
    const data = buildUnifiedEarningsResponse(period)

    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Allow short-term caching of mock aggregates
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[/api/earnings/unified] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch unified earnings',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}
