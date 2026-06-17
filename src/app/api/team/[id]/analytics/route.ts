import { NextRequest, NextResponse } from 'next/server'
import { getTeamById, computeTeamAnalytics } from '@/lib/team/mock-data'
import type { TeamAnalyticsResponse } from '@/lib/team/types'

/**
 * GET /api/team/[id]/analytics
 *
 * Aggregated team analytics: total clicks/conversions/earnings, 12-month
 * trend, per-member contribution, platform distribution, and top shared links.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<TeamAnalyticsResponse | { error: string; source: string }>> {
  try {
    const { id } = await params
    const team = getTeamById(id)

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'mock' },
        { status: 404 },
      )
    }

    const analytics = computeTeamAnalytics(id)

    return NextResponse.json(
      { analytics, source: 'mock' as const },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[/api/team/[id]/analytics GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch team analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}
