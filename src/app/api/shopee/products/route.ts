import { NextRequest, NextResponse } from 'next/server'
import { getShopeeServiceFromDB } from '@/lib/shopee/affiliate-api'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * GET /api/shopee/products
 * Search products using Shopee Affiliate API (real) or mock data
 *
 * Query params: q, category, minPrice, maxPrice, sort, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || undefined
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined
    const sort = searchParams.get('sort') as
      | 'commission'
      | 'price'
      | 'sales'
      | 'rating'
      | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      throw ApiError.badRequest('Search query parameter "q" is required')
    }

    // Sanity-check pagination params
    if (isNaN(page) || page < 1) {
      throw ApiError.badRequest('Invalid "page" parameter')
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Invalid "limit" parameter (must be 1-100)')
    }

    // Get the Shopee service (real API or mock fallback)
    const shopeeService = await getShopeeServiceFromDB()

    if (!shopeeService) {
      return NextResponse.json(
        { error: 'Shopee service unavailable' },
        { status: 503 }
      )
    }

    // Parse category to categoryId if it's a number string
    const categoryId = category && /^\d+$/.test(category) ? parseInt(category) : undefined

    const result = await shopeeService.searchProducts(query, {
      page,
      limit,
      sortField: sort || 'sales',
      sortOrder: 'desc',
      categoryId,
      minPrice,
      maxPrice,
    })

    return NextResponse.json({
      products: result.products,
      total: result.total,
      source: result.source,
      connected: !shopeeService.isUsingMock,
    })
  } catch (error) {
    return handleError(error)
  }
}
