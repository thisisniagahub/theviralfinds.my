import { NextRequest, NextResponse } from 'next/server'
import { getTikTokServiceFromDB } from '@/lib/tiktok/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'
import type { TikTokCommissionStatus } from '@/lib/tiktok/mock-data'

/**
 * GET /api/tiktok/commissions
 * Fetch TikTok Shop affiliate commission orders and a summary.
 *
 * Query params:
 *   startDate - ISO date (default: 30 days ago)
 *   endDate   - ISO date (default: now)
 *   status    - pending | confirmed | shipped | delivered | paid | rejected | refunded
 *   page      - default 1
 *   limit     - default 20
 */
export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const status = searchParams.get('status') as TikTokCommissionStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const now = Math.floor(Date.now() / 1000)
    const defaultStart = now - 30 * 86400

    const startTime = startDateStr
      ? Math.floor(new Date(startDateStr).getTime() / 1000)
      : defaultStart
    const endTime = endDateStr
      ? Math.floor(new Date(endDateStr).getTime() / 1000)
      : now

    const service = await getTikTokServiceFromDB()

    // Fetch orders + summary in parallel (each individually resilient)
    const [ordersResult, summaryResult] = await Promise.allSettled([
      service.getCommissions({
        page,
        limit,
        startTime,
        endTime,
        commissionStatus: status || undefined,
      }),
      service.getCommissionSummary({ startTime, endTime }),
    ])

    const orders =
      ordersResult.status === 'fulfilled'
        ? ordersResult.value
        : { orders: [], total: 0, source: 'mock' as const }

    const summary =
      summaryResult.status === 'fulfilled'
        ? summaryResult.value
        : {
            totalCommission: 0,
            pendingCommission: 0,
            confirmedCommission: 0,
            paidCommission: 0,
            rejectedCommission: 0,
            totalOrders: 0,
            conversionRate: 0,
            clickCount: 0,
            source: 'mock' as const,
          }

    // Prefer 'api' if either branch reported it
    const source =
      orders.source === 'api' || summary.source === 'api' ? 'api' : 'mock'

    return NextResponse.json({
      orders: orders.orders,
      summary: {
        totalCommission: summary.totalCommission,
        pendingCommission: summary.pendingCommission,
        confirmedCommission: summary.confirmedCommission,
        paidCommission: summary.paidCommission,
        rejectedCommission: summary.rejectedCommission,
        totalOrders: summary.totalOrders,
        conversionRate: summary.conversionRate,
        clickCount: summary.clickCount,
      },
      total: orders.total,
      source,
      connected: !service.isUsingMock,
    })
  } catch (error) {
    return handleError(error)
  }
}
