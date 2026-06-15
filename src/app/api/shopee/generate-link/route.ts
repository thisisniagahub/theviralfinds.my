import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'

/**
 * POST /api/shopee/generate-link
 * Generate a real Shopee affiliate tracking link
 * 
 * Body: { itemId?: number, productUrl?: string, subId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, productUrl, subId } = body

    if (!itemId && !productUrl) {
      return NextResponse.json(
        { error: 'Either itemId or productUrl is required' },
        { status: 400 }
      )
    }

    const shopeeService = await getShopeeServiceFromDB()

    if (!shopeeService) {
      // Generate a mock affiliate link when not connected
      const shortCode = Math.random().toString(36).substring(2, 8)
      const mockAffiliateUrl = `https://shopee.com.my/${productUrl ? '' : `product/-/${itemId}`}?af_id=${shortCode}&af_sub=${subId || ''}`

      return NextResponse.json({
        success: false,
        link: {
          shortUrl: `https://shp.ee/${shortCode}`,
          longUrl: mockAffiliateUrl,
          deepLink: `shopee://product/${itemId || 0}`,
        },
        source: 'demo',
        message: 'Shopee API not connected. This is a demo link. Connect your Shopee Affiliate API for real tracking links.',
      })
    }

    // Generate real affiliate link
    const link = await shopeeService.generateAffiliateLink({
      itemId: itemId || undefined,
      productUrl: productUrl || undefined,
      subId: subId || undefined,
    })

    return NextResponse.json({
      success: true,
      link: {
        shortUrl: link.shortUrl,
        longUrl: link.longUrl,
        deepLink: link.deepLink,
      },
      source: 'shopee_api',
    })
  } catch (error) {
    console.error('Generate affiliate link error:', error)
    return NextResponse.json(
      { error: 'Failed to generate affiliate link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
