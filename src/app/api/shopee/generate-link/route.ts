import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'
import { db } from '@/lib/db'

/**
 * POST /api/shopee/generate-link
 * Generate a Shopee affiliate tracking link and save to DB
 *
 * Body: { productId?, productUrl?, subId?, deepLinkType? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productUrl, subId, deepLinkType } = body

    if (!productId && !productUrl) {
      return NextResponse.json(
        { error: 'Either productId or productUrl is required' },
        { status: 400 }
      )
    }

    // Get the Shopee service (real API or mock fallback)
    const shopeeService = await getShopeeServiceFromDB()

    if (!shopeeService) {
      return NextResponse.json(
        { error: 'Shopee service unavailable' },
        { status: 503 }
      )
    }

    // Generate affiliate link
    const link = await shopeeService.generateAffiliateLink({
      itemId: productId || undefined,
      productUrl: productUrl || undefined,
      subId: subId || undefined,
      deepLinkType: deepLinkType || 'default',
    })

    // Save the generated link to the database (AffiliateLink table)
    let dbLinkId: string | null = null
    let saved = false

    try {
      const shortCode = Math.random().toString(36).substring(2, 10)
      const affiliateLink = await db.affiliateLink.create({
        data: {
          name: `Shopee Link - ${productId || productUrl}`,
          productUrl: productUrl || `https://shopee.com.my/product/-/${productId || 0}`,
          affiliateUrl: link.shortUrl || link.longUrl,
          productId: productId ? String(productId) : null,
          shortCode,
          status: 'active',
        },
      })
      dbLinkId = affiliateLink.id
      saved = true
    } catch (dbError) {
      console.error('Failed to save affiliate link to DB:', dbError)
      // Non-fatal — link was generated, just not saved
    }

    return NextResponse.json({
      link: {
        shortUrl: link.shortUrl,
        longUrl: link.longUrl,
        deepLink: link.deepLink,
        generateUrl: link.generateUrl,
      },
      saved,
      dbLinkId,
      source: link.source,
    })
  } catch (error) {
    console.error('Generate affiliate link error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate affiliate link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
