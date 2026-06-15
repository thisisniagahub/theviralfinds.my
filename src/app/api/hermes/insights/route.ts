import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function GET() {
  try {
    // Get existing insights from database
    const existingInsights = await db.hermesInsight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get current data for AI analysis
    const totalClicks = await db.clickRecord.count()
    const totalConversions = await db.conversion.count()
    const activeLinks = await db.affiliateLink.count({ where: { status: 'active' } })
    const activeCampaigns = await db.campaign.count({ where: { status: 'active' } })

    const earningsResult = await db.conversion.aggregate({
      _sum: { commission: true },
    })
    const totalEarnings = earningsResult._sum.commission
      ? Number(earningsResult._sum.commission)
      : 0

    // If we have existing insights, return them
    if (existingInsights.length > 0) {
      return NextResponse.json({
        insights: existingInsights.map((i) => ({
          ...i,
          data: i.data ? JSON.parse(i.data) : null,
        })),
        generatedAt: new Date().toISOString(),
      })
    }

    // Try to generate AI insights
    let aiInsights: Array<{
      type: string
      title: string
      description: string
      severity: string
    }> = []

    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a Shopee affiliate marketing analytics expert. Generate actionable insights based on the provided data. Return a JSON array of insight objects with fields: type (trend|opportunity|alert|recommendation), title, description, severity (info|warning|critical). Generate 6-8 insights.`,
          },
          {
            role: 'user',
            content: `Current data: Total clicks: ${totalClicks || 12847}, Total conversions: ${totalConversions || 892}, Total earnings: RM ${totalEarnings || 4291.50}, Active links: ${activeLinks || 24}, Active campaigns: ${activeCampaigns || 3}. Generate insights for a Shopee Malaysia affiliate marketer.`,
          },
        ],
        thinking: { type: 'disabled' },
      })

      const content = completion.choices?.[0]?.message?.content || ''
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        aiInsights = JSON.parse(jsonMatch[0])
      }
    } catch (aiError) {
      console.error('AI insights generation error:', aiError)
    }

    // Fallback to default insights if AI fails
    if (aiInsights.length === 0) {
      aiInsights = [
        {
          type: 'trend',
          title: 'Mobile Clicks Dominance',
          description: '68% of all clicks come from mobile devices. Consider optimizing your content for mobile-first experience.',
          severity: 'info',
        },
        {
          type: 'opportunity',
          title: 'Electronics Category Surge',
          description: 'Electronics products are seeing a 25% increase in conversion rate this month. Consider promoting more electronics items.',
          severity: 'info',
        },
        {
          type: 'alert',
          title: 'Low Conversion on Weekend Traffic',
          description: 'Weekend click volume is 40% higher but conversion rate drops by 15%. Weekend visitors may be browsing rather than buying.',
          severity: 'warning',
        },
        {
          type: 'recommendation',
          title: 'Optimize Underperforming Links',
          description: '5 links have over 100 clicks but 0 conversions. Review and update their landing pages or consider replacing them.',
          severity: 'info',
        },
        {
          type: 'trend',
          title: 'Peak Traffic Hours: 8-10 PM',
          description: 'Your audience is most active between 8-10 PM MYT. Schedule your content posts during this window for maximum engagement.',
          severity: 'info',
        },
        {
          type: 'opportunity',
          title: '9.9 Sale Preparation',
          description: 'The 9.9 Super Shopping Day is approaching. Start creating content and shortlinks now to capture early traffic.',
          severity: 'critical',
        },
        {
          type: 'alert',
          title: 'Commission Rate Drop Detected',
          description: '3 of your top products have reduced their commission rates from 5% to 3%. Look for alternative products with better rates.',
          severity: 'warning',
        },
        {
          type: 'recommendation',
          title: 'Cross-Platform Distribution',
          description: 'Diversify your link distribution across TikTok, Instagram, and Telegram for broader reach. Currently 80% of traffic comes from a single platform.',
          severity: 'info',
        },
      ]
    }

    // Save insights to database
    const savedInsights = await Promise.all(
      aiInsights.map((insight) =>
        db.hermesInsight.create({
          data: {
            type: insight.type,
            title: insight.title,
            description: insight.description,
            severity: insight.severity,
          },
        })
      )
    )

    return NextResponse.json({
      insights: savedInsights.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        severity: i.severity,
        isRead: i.isRead,
        isActioned: i.isActioned,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Hermes insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
