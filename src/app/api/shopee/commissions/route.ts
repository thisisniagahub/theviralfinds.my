import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/commissions
 * Fetch real commission data from Shopee Affiliate API
 * 
 * Query: ?period=7d|30d|90d&status=pending|confirmed|rejected|paid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const status = searchParams.get('status') as 'pending' | 'confirmed' | 'rejected' | 'paid' | null

    const shopeeService = await getShopeeServiceFromDB()

    if (!shopeeService) {
      // Return demo data when not connected
      return NextResponse.json({
        connected: false,
        summary: {
          totalCommission: 4280.50,
          pendingCommission: 750.00,
          confirmedCommission: 2780.50,
          rejectedCommission: 120.00,
          paidCommission: 29110.00,
          totalOrders: 892,
          conversionRate: 6.94,
        },
        orders: [],
        source: 'demo',
        message: 'Demo data. Connect Shopee API for real commission tracking.',
      })
    }

    // Calculate time range
    const now = Math.floor(Date.now() / 1000)
    const periodSeconds: Record<string, number> = {
      '7d': 7 * 86400,
      '30d': 30 * 86400,
      '90d': 90 * 86400,
    }
    const startTime = now - (periodSeconds[period] || periodSeconds['30d'])

    // Fetch real data in parallel
    const [summary, ordersResult] = await Promise.allSettled([
      shopeeService.getCommissionSummary({ startTime, endTime: now }),
      shopeeService.getCommissionOrders({
        startTime,
        endTime: now,
        commissionStatus: status || undefined,
        limit: 100,
      }),
    ])

    const commissionSummary = summary.status === 'fulfilled' ? summary.value : {
      totalCommission: 0, pendingCommission: 0, confirmedCommission: 0,
      rejectedCommission: 0, paidCommission: 0, totalOrders: 0, conversionRate: 0,
    }

    const commissionOrders = ordersResult.status === 'fulfilled' ? ordersResult.value : {
      orders: [], total: 0,
    }

    return NextResponse.json({
      connected: true,
      summary: commissionSummary,
      orders: commissionOrders.orders,
      total: commissionOrders.total,
      period,
      source: 'shopee_api',
    })
  } catch (error) {
    console.error('Shopee commissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    )
  }
}
