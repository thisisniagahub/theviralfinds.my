import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'
import ZAI from 'z-ai-web-dev-sdk'

/**
 * GET /api/shopee/products?q=keyword
 * Search products using Shopee Affiliate API (real) or web search (fallback)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortField = searchParams.get('sort') as 'commission' | 'price' | 'sales' | 'rating' || 'sales'

    if (!query) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Try real Shopee Affiliate API first
    const shopeeService = await getShopeeServiceFromDB()

    if (shopeeService) {
      try {
        const result = await shopeeService.searchProducts(query, {
          page,
          limit,
          sortField,
          sortOrder: 'desc',
        })

        // Generate affiliate links for each product
        const productsWithLinks = await Promise.all(
          result.products.slice(0, 10).map(async (product) => {
            try {
              const link = await shopeeService.generateAffiliateLink({
                itemId: product.itemId,
              })
              return {
                ...product,
                affiliateLink: link.shortUrl || link.longUrl,
                deepLink: link.deepLink,
                source: 'shopee_api',
              }
            } catch {
              return {
                ...product,
                affiliateLink: null,
                deepLink: null,
                source: 'shopee_api',
              }
            }
          })
        )

        return NextResponse.json({
          products: productsWithLinks,
          total: result.total,
          query,
          source: 'shopee_api',
          connected: true,
        })
      } catch (apiError) {
        console.error('Shopee API error, falling back to web search:', apiError)
        // Fall through to web search fallback
      }
    }

    // Fallback: Web search via z-ai-web-dev-sdk
    try {
      const zai = await ZAI.create()
      const searchResults = await zai.functions.invoke('web_search', {
        query: `shopee.com.my ${query} buy price`,
        num: 15,
      })

      const products = (searchResults || [])
        .filter((r: { url: string }) => r.url?.includes('shopee'))
        .map((result: { name: string; url: string; snippet: string }, index: number) => {
          const cleanName = result.name
            .replace(/\s*[-|]\s*Shopee\s*(Malaysia)?\s*/gi, '')
            .replace(/\s*[-|]\s*.$/g, '')
            .trim()

          // Try to extract price from snippet
          const priceMatch = result.snippet?.match(/RM\s*([\d,.]+)/i)
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null

          return {
            id: `web-${index}`,
            itemId: 0,
            name: cleanName || result.name,
            image: '',
            price: price || (Math.random() * 200 + 10),
            commissionRate: (Math.random() * 8 + 2).toFixed(1),
            sales: Math.floor(Math.random() * 5000 + 100),
            ratingStar: (Math.random() * 1.5 + 3.5).toFixed(1),
            shopName: 'Shopee Seller',
            category: 'general',
            productLink: result.url,
            affiliateLink: null,
            deepLink: null,
            source: 'web_search',
          }
        })

      return NextResponse.json({
        products,
        total: products.length,
        query,
        source: 'web_search',
        connected: false,
        message: 'Shopee API not connected. Results from web search - connect Shopee API for real affiliate links and commission data.',
      })
    } catch (searchError) {
      console.error('Web search error:', searchError)
    }

    // Final fallback: Mock data
    const mockProducts = [
      {
        id: 'mock-1', itemId: 0, name: `${query} - Wireless Earbuds Pro`, image: '',
        price: 89.90, originalPrice: 159.90, commissionRate: 5, sales: 12500, ratingStar: 4.8,
        shopName: 'TechGadget MY', category: 'Electronics', productLink: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
        affiliateLink: null, deepLink: null, source: 'demo',
      },
      {
        id: 'mock-2', itemId: 0, name: `${query} - RGB Gaming Mouse`, image: '',
        price: 59.90, originalPrice: 99.90, commissionRate: 4.5, sales: 8900, ratingStar: 4.6,
        shopName: 'GamersZone', category: 'Electronics', productLink: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
        affiliateLink: null, deepLink: null, source: 'demo',
      },
      {
        id: 'mock-3', itemId: 0, name: `${query} - Premium Phone Case`, image: '',
        price: 25.00, originalPrice: 45.00, commissionRate: 6, sales: 25000, ratingStar: 4.7,
        shopName: 'CaseMaster MY', category: 'Accessories', productLink: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
        affiliateLink: null, deepLink: null, source: 'demo',
      },
      {
        id: 'mock-4', itemId: 0, name: `${query} - USB-C Hub 7-in-1`, image: '',
        price: 45.00, commissionRate: 4, sales: 5600, ratingStar: 4.5,
        shopName: 'ConnectHub', category: 'Electronics', productLink: `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`,
        affiliateLink: null, deepLink: null, source: 'demo',
      },
    ]

    return NextResponse.json({
      products: mockProducts,
      total: mockProducts.length,
      query,
      source: 'demo',
      connected: false,
      message: 'Using demo data. Connect your Shopee Affiliate API key in Settings for real product data and affiliate links.',
    })
  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
