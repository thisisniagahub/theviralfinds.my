import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateBody, createCampaignSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const campaigns = await db.campaign.findMany({
      where,
      include: {
        _count: { select: { links: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedCampaigns = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      budget: c.budget ? Number(c.budget) : null,
      spent: Number(c.spent),
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      linksCount: c._count.links,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    return NextResponse.json({ campaigns: formattedCampaigns, total: formattedCampaigns.length })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, createCampaignSchema)

    const campaign = await db.campaign.create({
      data: {
        name: data.name,
        description: data.description || null,
        status: data.status || 'active',
        budget: data.budget || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json(
      {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        budget: campaign.budget ? Number(campaign.budget) : null,
        spent: Number(campaign.spent),
        startDate: campaign.startDate ? campaign.startDate.toISOString() : null,
        endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
