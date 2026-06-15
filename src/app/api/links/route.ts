import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function generateShortCode(): string {
  return randomBytes(4).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
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
    console.error('Links GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      productUrl,
      affiliateUrl,
      productId,
      productName,
      productImage,
      productPrice,
      commission,
      commissionRate,
      category,
      campaignId,
      userId,
      expiresAt,
      tags,
    } = body

    if (!name || !productUrl || !affiliateUrl) {
      return NextResponse.json(
        { error: 'name, productUrl, and affiliateUrl are required' },
        { status: 400 }
      )
    }

    // Generate unique short code
    let shortCode = generateShortCode()
    let existing = await db.affiliateLink.findUnique({ where: { shortCode } })
    while (existing) {
      shortCode = generateShortCode()
      existing = await db.affiliateLink.findUnique({ where: { shortCode } })
    }

    const link = await db.affiliateLink.create({
      data: {
        name,
        productUrl,
        affiliateUrl,
        productId: productId || null,
        productName: productName || null,
        productImage: productImage || null,
        productPrice: productPrice || null,
        commission: commission || null,
        commissionRate: commissionRate || 5,
        category: category || null,
        campaignId: campaignId || null,
        userId: userId || null,
        shortCode,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        tags: tags || null,
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
    console.error('Links POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    )
  }
}
