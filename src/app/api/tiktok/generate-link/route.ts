import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTikTokServiceFromDB } from '@/lib/tiktok/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { validateBody } from '@/lib/validation'

/**
 * POST /api/tiktok/generate-link
 * Generate a TikTok Shop affiliate tracking link.
 *
 * Body: { productId?, productUrl?, subId? }
 *  - At least one of `productId` or `productUrl` is required.
 */
const tiktokGenerateLinkSchema = z
  .object({
    productId: z.union([z.string(), z.number()]).optional(),
    productUrl: z.string().url().optional(),
    subId: z.string().max(100).optional(),
    // Optional product metadata so the route can save a richer AffiliateLink row
    productName: z.string().max(300).optional(),
    productImage: z.string().url().optional(),
    productPrice: z.number().nonnegative().optional(),
    commissionRate: z.number().nonnegative().max(100).optional(),
    category: z.string().max(100).optional(),
  })
  .refine((data) => data.productId || data.productUrl, {
    message: 'Either productId or productUrl is required',
    path: ['productId'],
  })

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    const data = await validateBody(request, tiktokGenerateLinkSchema)
    const { productId, productUrl, subId } = data

    const service = await getTikTokServiceFromDB()

    // Generate affiliate link (real or mock)
    const link = await service.generateAffiliateLink({
      productId: productId !== undefined ? String(productId) : undefined,
      productUrl: productUrl || undefined,
      subId: subId || undefined,
    })

    // Persist to AffiliateLink table — non-fatal if save fails
    let dbLinkId: string | null = null
    let saved = false

    try {
      const { db } = await import('@/lib/db')
      const shortCode = link.trackingId || Math.random().toString(36).substring(2, 10)
      const affiliateLink = await db.affiliateLink.create({
        data: {
          name: `TikTok Link - ${data.productName || productId || productUrl}`,
          productUrl: productUrl || `https://shop.tiktok.com/view/product/${productId || ''}`,
          affiliateUrl: link.shortUrl || link.longUrl,
          productId: productId ? String(productId) : null,
          productName: data.productName || null,
          productImage: data.productImage || null,
          productPrice: data.productPrice || null,
          commissionRate: data.commissionRate || null,
          category: data.category || null,
          shortCode,
          status: 'active',
        },
      })
      dbLinkId = affiliateLink.id
      saved = true
    } catch (dbError) {
      console.error('Failed to save TikTok affiliate link to DB:', dbError)
      // Non-fatal — link was generated, just not saved
    }

    return NextResponse.json({
      link: {
        shortUrl: link.shortUrl,
        longUrl: link.longUrl,
        deepLink: link.deepLink,
        generateUrl: link.generateUrl,
        trackingId: link.trackingId,
        expiresAt: link.expiresAt,
      },
      saved,
      dbLinkId,
      source: link.source,
    })
  } catch (error) {
    return handleError(error)
  }
}
