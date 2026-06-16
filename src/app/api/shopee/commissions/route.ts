import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/commissions
 * Fetch commission orders and summary from Shopee Affiliate API
 *
 * Query params: startDate, endDate, status, page, limit
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse dates to unix timestamps
    const now = Math.floor(Date.now() / 1000)
    const defaultStart = now - 30 * 86400 // Default: 30 days ago

    const startTime = startDateStr
      ? Math.floor(new Date(startDateStr).getTime() / 1000)
      : defaultStart
    const endTime = endDateStr
      ? Math.floor(new Date(endDateStr).getTime() / 1000)
      : now

    // Get the Shopee service (real API or mock fallback)
    const shopeeService = await getShopeeServiceFromDB()

    if (!shopeeService) {
      return NextResponse.json(
        { error: 'Shopee service unavailable' },
        { status: 503 }
      )
    }

    // Fetch commission orders and summary in parallel
    const [ordersResult, summaryResult] = await Promise.allSettled([
      shopeeService.getCommissionOrders({
        page,
        limit,
        startTime,
        endTime,
        commissionStatus: status || undefined,
      }),
      shopeeService.getCommissionSummary({
        startTime,
        endTime,
      }),
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

    // Determine source from whichever succeeded (prefer real API)
    const source = orders.source === 'graphql_api' || summary.source === 'graphql_api'
      ? 'graphql_api'
      : 'mock'

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
    console.error('Shopee commissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    )
  }
}
