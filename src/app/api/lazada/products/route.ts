import { NextRequest, NextResponse } from 'next/server'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * GET /api/lazada/products
 * Search products using Lazada Affiliate API (real) or mock data fallback.
 *
 * Query params: q, category, minPrice, maxPrice, sort, page, limit
 *
 * Response includes `source: 'mock' | 'api'` to indicate data origin.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

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

    if (isNaN(page) || page < 1) {
      throw ApiError.badRequest('Invalid "page" parameter')
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Invalid "limit" parameter (must be 1-100)')
    }

    // Get the Lazada service — auto-detects mock vs real based on credentials
    const service = await getLazadaServiceFromDB()

    // Parse category to categoryId if it's a number string
    const categoryId =
      category && /^\d+$/.test(category) ? parseInt(category) : undefined

    const result = await service.searchProducts(query, {
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
      connected: !service.isUsingMock,
    })
  } catch (error) {
    return handleError(error)
  }
}
