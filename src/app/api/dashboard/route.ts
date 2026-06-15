import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Aggregate stats
    const totalClicksResult = await db.affiliateLink.aggregate({
      _sum: { clicks: true },
    })
    const totalConversionsResult = await db.affiliateLink.aggregate({
      _sum: { conversions: true },
    })
    const totalEarningsResult = await db.affiliateLink.aggregate({
      _sum: { earnings: true },
    })

    const totalClicks = totalClicksResult._sum.clicks || 0
    const totalConversions = totalConversionsResult._sum.conversions || 0
    const totalEarnings = totalEarningsResult._sum.earnings
      ? Number(totalEarningsResult._sum.earnings)
      : 0
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Active links and campaigns count
    const activeLinks = await db.affiliateLink.count({
      where: { status: 'active' },
    })
    const activeCampaigns = await db.campaign.count({
      where: { status: 'active' },
    })

    // Trends: compare current period vs previous period (last 30 days vs 30 days before)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const currentPeriodClicks = await db.clickRecord.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    const previousPeriodClicks = await db.clickRecord.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    })

    const currentPeriodConversions = await db.conversion.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    const previousPeriodConversions = await db.conversion.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    })

    const currentPeriodEarningsResult = await db.conversion.aggregate({
      _sum: { commission: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    })
    const previousPeriodEarningsResult = await db.conversion.aggregate({
      _sum: { commission: true },
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    })

    const currentEarnings = currentPeriodEarningsResult._sum.commission
      ? Number(currentPeriodEarningsResult._sum.commission)
      : 0
    const previousEarnings = previousPeriodEarningsResult._sum.commission
      ? Number(previousPeriodEarningsResult._sum.commission)
      : 0

    const clickTrend =
      previousPeriodClicks > 0
        ? ((currentPeriodClicks - previousPeriodClicks) / previousPeriodClicks) * 100
        : 0
    const conversionTrend =
      previousPeriodConversions > 0
        ? ((currentPeriodConversions - previousPeriodConversions) / previousPeriodConversions) * 100
        : 0
    const earningsTrend =
      previousEarnings > 0 ? ((currentEarnings - previousEarnings) / previousEarnings) * 100 : 0

    // Recent activity (last 10 events from click records and conversions)
    const recentClicks = await db.clickRecord.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { affiliateLink: { select: { name: true, shortCode: true } } },
    })
    const recentConversions = await db.conversion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { affiliateLink: { select: { name: true, shortCode: true } } },
    })

    const recentActivity = [
      ...recentClicks.map((c) => ({
        id: c.id,
        type: 'click' as const,
        linkName: c.affiliateLink?.name || 'Unknown',
        shortCode: c.affiliateLink?.shortCode || '',
        country: c.country || null,
        device: c.device || null,
        timestamp: c.createdAt.toISOString(),
      })),
      ...recentConversions.map((c) => ({
        id: c.id,
        type: 'conversion' as const,
        linkName: c.affiliateLink?.name || 'Unknown',
        shortCode: c.affiliateLink?.shortCode || '',
        amount: Number(c.amount),
        commission: Number(c.commission),
        status: c.status,
        timestamp: c.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // Top products (top 5 by earnings)
    const topProducts = await db.affiliateLink.findMany({
      take: 5,
      orderBy: { earnings: 'desc' },
      where: { earnings: { gt: 0 } },
      select: {
        id: true,
        productName: true,
        productImage: true,
        productPrice: true,
        commission: true,
        clicks: true,
        conversions: true,
        earnings: true,
      },
    })

    const topProductsFormatted = topProducts.map((p) => ({
      ...p,
      productPrice: p.productPrice ? Number(p.productPrice) : null,
      commission: p.commission ? Number(p.commission) : null,
      earnings: Number(p.earnings),
    }))

    // If no data, provide demo data
    const hasData = totalClicks > 0 || totalConversions > 0 || totalEarnings > 0

    if (!hasData) {
      return NextResponse.json({
        stats: {
          totalClicks: 12847,
          totalConversions: 892,
          totalEarnings: 4291.5,
          conversionRate: 6.94,
          activeLinks: 24,
          activeCampaigns: 3,
        },
        trends: {
          clicks: 12.5,
          conversions: 8.3,
          earnings: 15.2,
          conversionRate: -0.4,
        },
        recentActivity: [
          {
            id: 'demo-1',
            type: 'conversion',
            linkName: 'Wireless Earbuds Pro',
            shortCode: 'shp01',
            amount: 89.9,
            commission: 4.5,
            status: 'confirmed',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: 'demo-2',
            type: 'click',
            linkName: 'RGB Gaming Mouse',
            shortCode: 'shp02',
            country: 'MY',
            device: 'mobile',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: 'demo-3',
            type: 'conversion',
            linkName: 'Phone Case Ultra',
            shortCode: 'shp03',
            amount: 25.0,
            commission: 1.25,
            status: 'pending',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
          {
            id: 'demo-4',
            type: 'click',
            linkName: 'Fitness Tracker Band',
            shortCode: 'shp04',
            country: 'SG',
            device: 'desktop',
            timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          },
          {
            id: 'demo-5',
            type: 'conversion',
            linkName: 'USB-C Hub 7-in-1',
            shortCode: 'shp05',
            amount: 45.0,
            commission: 2.25,
            status: 'confirmed',
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
        ],
        topProducts: [
          {
            id: 'demo-p1',
            productName: 'Wireless Earbuds Pro',
            productImage: null,
            productPrice: 89.9,
            commission: 4.5,
            clicks: 3200,
            conversions: 280,
            earnings: 1260.0,
          },
          {
            id: 'demo-p2',
            productName: 'RGB Gaming Mouse',
            productImage: null,
            productPrice: 59.9,
            commission: 3.0,
            clicks: 2100,
            conversions: 195,
            earnings: 585.0,
          },
          {
            id: 'demo-p3',
            productName: 'USB-C Hub 7-in-1',
            productImage: null,
            productPrice: 45.0,
            commission: 2.25,
            clicks: 1800,
            conversions: 160,
            earnings: 360.0,
          },
          {
            id: 'demo-p4',
            productName: 'Phone Case Ultra',
            productImage: null,
            productPrice: 25.0,
            commission: 1.25,
            clicks: 1500,
            conversions: 142,
            earnings: 177.5,
          },
          {
            id: 'demo-p5',
            productName: 'Fitness Tracker Band',
            productImage: null,
            productPrice: 79.9,
            commission: 4.0,
            clicks: 1200,
            conversions: 115,
            earnings: 460.0,
          },
        ],
      })
    }

    return NextResponse.json({
      stats: {
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate: Math.round(conversionRate * 100) / 100,
        activeLinks,
        activeCampaigns,
      },
      trends: {
        clicks: Math.round(clickTrend * 100) / 100,
        conversions: Math.round(conversionTrend * 100) / 100,
        earnings: Math.round(earningsTrend * 100) / 100,
        conversionRate: Math.round(
          (conversionTrend - (clickTrend || 1)) * 100
        ) / 100,
      },
      recentActivity,
      topProducts: topProductsFormatted,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
