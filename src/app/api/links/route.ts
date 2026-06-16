import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { validateBody, createLinkSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

function generateShortCode(): string {
  return randomBytes(4).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { productName: { contains: search } },
        { shortCode: { contains: search } },
        { productUrl: { contains: search } },
      ]
    }

    const links = await db.affiliateLink.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedLinks = links.map((link) => ({
      ...link,
      productPrice: link.productPrice ? Number(link.productPrice) : null,
      commission: link.commission ? Number(link.commission) : null,
      commissionRate: link.commissionRate ? Number(link.commissionRate) : null,
      earnings: Number(link.earnings),
      ctr: link.ctr ? Number(link.ctr) : null,
    }))

    return NextResponse.json({ links: formattedLinks, total: formattedLinks.length })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, createLinkSchema)

    // Generate unique short code (retry on collision)
    let shortCode = generateShortCode()
    let existing = await db.affiliateLink.findUnique({ where: { shortCode } })
    let attempts = 0
    while (existing && attempts < 5) {
      shortCode = generateShortCode()
      existing = await db.affiliateLink.findUnique({ where: { shortCode } })
      attempts++
    }

    const link = await db.affiliateLink.create({
      data: {
        name: data.name,
        productUrl: data.productUrl,
        affiliateUrl: data.affiliateUrl,
        productId: data.productId || null,
        productName: data.productName || null,
        productImage: data.productImage || null,
        productPrice: data.productPrice || null,
        commission: data.commission || null,
        commissionRate: data.commissionRate || 5,
        category: data.category || null,
        campaignId: data.campaignId || null,
        userId: data.userId || null,
        shortCode,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        tags: data.tags || null,
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        ...link,
        productPrice: link.productPrice ? Number(link.productPrice) : null,
        commission: link.commission ? Number(link.commission) : null,
        commissionRate: link.commissionRate ? Number(link.commissionRate) : null,
        earnings: Number(link.earnings),
        ctr: link.ctr ? Number(link.ctr) : null,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
