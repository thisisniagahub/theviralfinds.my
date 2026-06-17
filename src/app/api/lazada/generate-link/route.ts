import { NextRequest, NextResponse } from 'next/server'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * POST /api/lazada/generate-link
 * Generate a Lazada affiliate tracking link.
 *
 * Body: { productId?, productUrl?, subId? }
 * Either productId or productUrl is required.
 *
 * Response includes `source: 'mock' | 'api'`.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    let body: { productId?: number | string; productUrl?: string; subId?: string }
    try {
      body = await request.json()
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const { productId, productUrl, subId } = body

    if (!productId && !productUrl) {
      throw ApiError.badRequest('Either productId or productUrl is required')
    }

    const service = await getLazadaServiceFromDB()

    // Normalise itemId to a number (Lazada item IDs are integers)
    const itemId =
      productId !== undefined
        ? typeof productId === 'number'
          ? productId
          : parseInt(String(productId), 10)
        : undefined

    if (itemId !== undefined && isNaN(itemId)) {
      throw ApiError.badRequest('productId must be a valid number')
    }

    const link = await service.generateAffiliateLink({
      itemId,
      productUrl: productUrl || undefined,
      subId: subId || undefined,
    })

    return NextResponse.json({
      link: {
        shortUrl: link.shortUrl,
        longUrl: link.longUrl,
        deepLink: link.deepLink,
        trackingUrl: link.trackingUrl,
        subId: link.subId,
      },
      source: link.source,
    })
  } catch (error) {
    return handleError(error)
  }
}
