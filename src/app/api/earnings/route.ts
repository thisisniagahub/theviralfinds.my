import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

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

    // Check if we have any data
    const totalConversions = await db.conversion.count()

    if (totalConversions === 0) {
      return NextResponse.json(getDemoEarnings(period))
    }

    // Summary
    const totalEarningsResult = await db.conversion.aggregate({
      _sum: { commission: true, amount: true },
    })
    const periodEarningsResult = await db.conversion.aggregate({
      _sum: { commission: true, amount: true },
      where: { createdAt: { gte: startDate } },
    })

    const totalEarnings = totalEarningsResult._sum.commission
      ? Number(totalEarningsResult._sum.commission)
      : 0
    const periodEarnings = periodEarningsResult._sum.commission
      ? Number(periodEarningsResult._sum.commission)
      : 0
    const totalRevenue = totalEarningsResult._sum.amount
      ? Number(totalEarningsResult._sum.amount)
      : 0

    // Chart data - earnings by day
    const earningsByDayRaw = await db.conversion.groupBy({
      by: ['createdAt'],
      _sum: { commission: true },
      where: { createdAt: { gte: startDate } },
    })

    const earningsChart = aggregateByDay(
      earningsByDayRaw.map((r) => ({
        date: r.createdAt,
        value: r._sum.commission ? Number(r._sum.commission) : 0,
      })),
      startDate,
      now
    )

    // Recent conversions
    const recentConversions = await db.conversion.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        affiliateLink: {
          select: { name: true, productName: true, shortCode: true },
        },
      },
    })

    // Payout history
    const payouts = await db.payout.findMany({
      orderBy: { requestedAt: 'desc' },
      take: 10,
    })

    // Pending payout amount
    const pendingPayoutResult = await db.payout.aggregate({
      _sum: { amount: true },
      where: { status: 'pending' },
    })
    const pendingPayout = pendingPayoutResult._sum.amount
      ? Number(pendingPayoutResult._sum.amount)
      : 0

    // Earning goals
    const earningGoals = await db.earningGoal.findMany({
      where: { status: 'active' },
    })

    return NextResponse.json({
      period,
      summary: {
        totalEarnings,
        periodEarnings,
        totalRevenue,
        pendingPayout,
        conversionCount: totalConversions,
        avgCommission: totalConversions > 0 ? totalEarnings / totalConversions : 0,
      },
      chart: earningsChart,
      recentConversions: recentConversions.map((c) => ({
        id: c.id,
        linkName: c.affiliateLink?.name || c.affiliateLink?.productName || 'Unknown',
        amount: Number(c.amount),
        commission: Number(c.commission),
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        requestedAt: p.requestedAt.toISOString(),
        processedAt: p.processedAt ? p.processedAt.toISOString() : null,
        note: p.note,
      })),
      goals: earningGoals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        period: g.period,
        status: g.status,
        progress:
          Number(g.targetAmount) > 0
            ? Math.min(
                100,
                Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
              )
            : 0,
      })),
    })
  } catch (error) {
    console.error('Earnings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}

function aggregateByDay(
  data: Array<{ date: Date; value: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const dayMap = new Map<string, number>()

  const current = new Date(startDate)
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0]
    dayMap.set(key, 0)
    current.setDate(current.getDate() + 1)
  }

  for (const item of data) {
    const key = new Date(item.date).toISOString().split('T')[0]
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + item.value)
    }
  }

  return Array.from(dayMap.entries()).map(([date, value]) => ({ date, value }))
}

function getDemoEarnings(period: string): Record<string, unknown> {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const chart: Array<{ date: string; value: number }> = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    chart.push({
      date,
      value: Math.round((Math.random() * 50 + 80) * 100) / 100,
    })
  }

  return {
    period,
    summary: {
      totalEarnings: 4291.5,
      periodEarnings: 2180.75,
      totalRevenue: 85430.0,
      pendingPayout: 345.0,
      conversionCount: 892,
      avgCommission: 4.81,
    },
    chart,
    recentConversions: [
      {
        id: 'demo-c1',
        linkName: 'Wireless Earbuds Pro',
        amount: 89.9,
        commission: 4.5,
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'demo-c2',
        linkName: 'RGB Gaming Mouse',
        amount: 59.9,
        commission: 3.0,
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'demo-c3',
        linkName: 'Phone Case Ultra Slim',
        amount: 25.0,
        commission: 1.5,
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: 'demo-c4',
        linkName: 'USB-C Hub 7-in-1',
        amount: 45.0,
        commission: 2.25,
        status: 'paid',
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: 'demo-c5',
        linkName: 'Fitness Tracker Band',
        amount: 79.9,
        commission: 4.0,
        status: 'confirmed',
        createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      },
    ],
    payouts: [
      {
        id: 'demo-p1',
        amount: 1250.0,
        method: 'bank_transfer',
        status: 'completed',
        requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Monthly payout - March 2025',
      },
      {
        id: 'demo-p2',
        amount: 890.0,
        method: 'bank_transfer',
        status: 'processing',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        processedAt: null,
        note: 'Monthly payout - April 2025',
      },
    ],
    goals: [
      {
        id: 'demo-g1',
        name: 'Monthly Earnings Target',
        targetAmount: 5000,
        currentAmount: 2180.75,
        period: 'monthly',
        status: 'active',
        progress: 44,
      },
      {
        id: 'demo-g2',
        name: 'Quarterly Revenue Goal',
        targetAmount: 15000,
        currentAmount: 8543.0,
        period: 'yearly',
        status: 'active',
        progress: 57,
      },
    ],
  }
}
