import { NextRequest, NextResponse } from 'next/server'
import { getTikTokServiceFromDB } from '@/lib/tiktok/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import type { TikTokProductCategory } from '@/lib/tiktok/mock-data'

/**
 * GET /api/tiktok/products
 * Search TikTok Shop affiliate products (real API or mock fallback).
 *
 * Query params:
 *   q         - Search keyword (required; can be empty to list trending)
 *   category  - Optional category filter (Beauty, Fashion, Electronics, ...)
 *   page      - Page number (default 1)
 *   limit     - Page size (default 20, max 100)
 *   sort      - commission | price | sales | rating | trend (default trend)
 *   minPrice  - Optional minimum price in RM
 *   maxPrice  - Optional maximum price in RM
 */
export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.read)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') as TikTokProductCategory | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') as
      | 'commission'
      | 'price'
      | 'sales'
      | 'rating'
      | 'trend'
      | null
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined

    if (isNaN(page) || page < 1) {
      throw ApiError.badRequest('Invalid "page" parameter')
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Invalid "limit" parameter (must be 1-100)')
    }

    const service = await getTikTokServiceFromDB()

    const result = await service.searchProducts(query, {
      page,
      limit,
      sortField: sort || 'trend',
      sortOrder: 'desc',
      category: category || undefined,
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
