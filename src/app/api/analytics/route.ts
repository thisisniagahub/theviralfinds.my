import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // Check if we have data
    const totalClicks = await db.clickRecord.count()
    const totalConversions = await db.conversion.count()

    // If no data, return demo analytics
    if (totalClicks === 0 && totalConversions === 0) {
      return NextResponse.json(getDemoAnalytics(period))
    }

    // Clicks over time (grouped by day)
    const clicksOverTime = await db.clickRecord.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    })

    const clicksByDay = aggregateByDay(
      clicksOverTime.map((r) => ({ date: r.createdAt, count: r._count.id })),
      startDate,
      now
    )

    // Conversions over time
    const conversionsOverTime = await db.conversion.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    })

    const conversionsByDay = aggregateByDay(
      conversionsOverTime.map((r) => ({ date: r.createdAt, count: r._count.id })),
      startDate,
      now
    )

    // Countries breakdown
    const clicksByCountry = await db.clickRecord.groupBy({
      by: ['country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { country: { not: null } },
    })

    const countryData = clicksByCountry
      .filter((c) => c.country !== null)
      .map((c) => ({
        country: c.country || 'Unknown',
        clicks: c._count.id,
      }))

    // Device breakdown
    const clicksByDevice = await db.clickRecord.groupBy({
      by: ['device'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      where: { device: { not: null } },
    })

    const deviceData = clicksByDevice
      .filter((d) => d.device !== null)
      .map((d) => ({
        device: d.device || 'Unknown',
        clicks: d._count.id,
      }))

    // Category breakdown
    const clicksByCategory = await db.affiliateLink.groupBy({
      by: ['category'],
      _sum: { clicks: true, conversions: true },
      _count: { id: true },
      where: { category: { not: null } },
    })

    const categoryData = clicksByCategory
      .filter((c) => c.category !== null)
      .map((c) => ({
        category: c.category || 'Unknown',
        links: c._count.id,
        clicks: c._sum.clicks || 0,
        conversions: c._sum.conversions || 0,
      }))

    // Summary stats
    const periodClicks = await db.clickRecord.count({
      where: { createdAt: { gte: startDate } },
    })
    const periodConversions = await db.conversion.count({
      where: { createdAt: { gte: startDate } },
    })
    const periodEarningsResult = await db.conversion.aggregate({
      _sum: { commission: true, amount: true },
      where: { createdAt: { gte: startDate } },
    })

    return NextResponse.json({
      period,
      summary: {
        clicks: periodClicks,
        conversions: periodConversions,
        earnings: periodEarningsResult._sum.commission
          ? Number(periodEarningsResult._sum.commission)
          : 0,
        revenue: periodEarningsResult._sum.amount
          ? Number(periodEarningsResult._sum.amount)
          : 0,
        conversionRate:
          periodClicks > 0
            ? Math.round((periodConversions / periodClicks) * 10000) / 100
            : 0,
      },
      clicksOverTime: clicksByDay,
      conversionsOverTime: conversionsByDay,
      countries: countryData,
      devices: deviceData,
      categories: categoryData,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

function aggregateByDay(
  data: Array<{ date: Date; count: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; count: number }> {
  const dayMap = new Map<string, number>()

  // Initialize all days
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0]
    dayMap.set(key, 0)
    current.setDate(current.getDate() + 1)
  }

  // Fill in data
  for (const item of data) {
    const key = new Date(item.date).toISOString().split('T')[0]
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + item.count)
    }
  }

  return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))
}

function getDemoAnalytics(period: string): Record<string, unknown> {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const clicksOverTime: Array<{ date: string; count: number }> = []
  const conversionsOverTime: Array<{ date: string; count: number }> = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    clicksOverTime.push({
      date,
      count: Math.floor(Math.random() * 200) + 100,
    })
    conversionsOverTime.push({
      date,
      count: Math.floor(Math.random() * 20) + 5,
    })
  }

  return {
    period,
    summary: {
      clicks: 12847,
      conversions: 892,
      earnings: 4291.5,
      revenue: 85430.0,
      conversionRate: 6.94,
    },
    clicksOverTime,
    conversionsOverTime,
    countries: [
      { country: 'MY', clicks: 8540 },
      { country: 'SG', clicks: 1920 },
      { country: 'ID', clicks: 1050 },
      { country: 'TH', clicks: 680 },
      { country: 'PH', clicks: 420 },
      { country: 'VN', clicks: 237 },
    ],
    devices: [
      { device: 'mobile', clicks: 8736 },
      { device: 'desktop', clicks: 3211 },
      { device: 'tablet', clicks: 900 },
    ],
    categories: [
      { category: 'electronics', links: 8, clicks: 4200, conversions: 336 },
      { category: 'fashion', links: 6, clicks: 3100, conversions: 217 },
      { category: 'home', links: 4, clicks: 2400, conversions: 168 },
      { category: 'beauty', links: 3, clicks: 1800, conversions: 108 },
      { category: 'sports', links: 3, clicks: 1347, conversions: 63 },
    ],
  }
}
