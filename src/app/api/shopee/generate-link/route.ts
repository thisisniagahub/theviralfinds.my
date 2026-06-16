import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'
import { db } from '@/lib/db'
import { validateBody, generateLinkSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'

/**
 * POST /api/shopee/generate-link
 * Generate a Shopee affiliate tracking link and save to DB
 *
 * Body: { productId?, productUrl?, subId?, deepLinkType? }
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, generateLinkSchema)
    const { productId, productUrl, subId, deepLinkType } = data

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
      itemId: productId ? String(productId) : undefined,
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
    return handleError(error)
  }
}
