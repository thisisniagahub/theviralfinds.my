import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'

/**
 * GET /api/shopee/stats
 * Fetch real click/conversion statistics from Shopee
 * 
 * Query: ?period=7d|30d|90d&granularity=hour|day|week|month
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const granularity = searchParams.get('granularity') || 'day'

    const shopeeService = await getShopeeServiceFromDB()

    if (!shopeeService) {
      // Return demo data when not connected
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
      const demoStats = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        return {
          date: date.toISOString().split('T')[0],
          clicks: Math.floor(Math.random() * 500 + 100),
          uniqueClicks: Math.floor(Math.random() * 350 + 70),
          conversions: Math.floor(Math.random() * 30 + 5),
          earnings: parseFloat((Math.random() * 200 + 50).toFixed(2)),
        }
      })

      return NextResponse.json({
        connected: false,
        stats: demoStats,
        source: 'demo',
        message: 'Demo data. Connect Shopee API for real statistics.',
      })
    }

    const now = Math.floor(Date.now() / 1000)
    const periodSeconds: Record<string, number> = {
      '7d': 7 * 86400,
      '30d': 30 * 86400,
      '90d': 90 * 86400,
    }
    const startTime = now - (periodSeconds[period] || periodSeconds['30d'])

    const stats = await shopeeService.getClickStats({
      startTime,
      endTime: now,
      granularity: granularity as 'hour' | 'day' | 'week' | 'month',
    })

    return NextResponse.json({
      connected: true,
      stats,
      period,
      granularity,
      source: 'shopee_api',
    })
  } catch (error) {
    console.error('Shopee stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
