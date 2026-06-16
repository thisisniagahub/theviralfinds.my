import { NextRequest, NextResponse } from 'next/server'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * GET /api/lazada/commissions
 * Fetch commission orders and summary from Lazada Affiliate API.
 *
 * Query params: startDate, endDate, status, page, limit
 * - startDate/endDate: ISO date strings (e.g. "2024-01-01")
 * - status: 'pending' | 'confirmed' | 'rejected' | 'paid'
 *
 * Response includes `source: 'mock' | 'api'`.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const status = searchParams.get('status') as
      | 'pending'
      | 'confirmed'
      | 'rejected'
      | 'paid'
      | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Convert ISO dates → unix seconds (Lazada API uses unix timestamps)
    const now = Math.floor(Date.now() / 1000)
    const defaultStart = now - 30 * 86400 // Default: 30 days ago

    const startTime = startDateStr
      ? Math.floor(new Date(startDateStr).getTime() / 1000)
      : defaultStart
    const endTime = endDateStr
      ? Math.floor(new Date(endDateStr).getTime() / 1000)
      : now

    const service = await getLazadaServiceFromDB()

    // Fetch orders + summary in parallel (each independently falls back to mock)
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
            rejectedCommission: 0,
            paidCommission: 0,
            totalOrders: 0,
            conversionRate: 0,
            source: 'mock' as const,
          }

    // Prefer "api" if either side succeeded via API
    const source = orders.source === 'api' || summary.source === 'api' ? 'api' : 'mock'

    return NextResponse.json({
      orders: orders.orders,
      summary: {
        totalCommission: summary.totalCommission,
        pendingCommission: summary.pendingCommission,
        confirmedCommission: summary.confirmedCommission,
        rejectedCommission: summary.rejectedCommission,
        paidCommission: summary.paidCommission,
        totalOrders: summary.totalOrders,
        conversionRate: summary.conversionRate,
      },
      total: orders.total,
      source,
    })
  } catch (error) {
    return handleError(error)
  }
}
