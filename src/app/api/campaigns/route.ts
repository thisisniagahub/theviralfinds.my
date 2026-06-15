import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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
    console.error('Campaigns GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, status, budget, startDate, endDate } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      )
    }

    const campaign = await db.campaign.create({
      data: {
        name,
        description: description || null,
        status: status || 'active',
        budget: budget || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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
    console.error('Campaigns POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
