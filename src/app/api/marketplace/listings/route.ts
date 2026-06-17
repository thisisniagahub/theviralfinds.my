import { NextRequest, NextResponse } from 'next/server'

import {
  CURRENT_SELLER_ID,
  type CreateListingRequest,
  type CreateListingResponse,
  type ListingCategory,
  type ListingNiche,
  type ListingPlatform,
  type ListingSort,
  type MarketplaceDataSource,
  type MarketplaceListing,
  type MarketplaceListingsResponse,
} from '@/lib/marketplace/types'
import {
  MOCK_SELLERS,
  getAllListings,
  getFeaturedListings,
  userCreatedListings,
} from '@/lib/marketplace/mock-data'

/**
 * Affiliate Content Marketplace — Listings API
 *
 * Fasa 4.2 (CHECKLIST 4.2.2).
 *
 * GET  /api/marketplace/listings
 *   Query params:
 *     - category: comma-separated ListingCategory values
 *     - platform: ListingPlatform | 'all'
 *     - niche:    ListingNiche | 'all'
 *     - sort:     popular | newest | price_low | price_high | rating
 *     - q:        free-text search (matches title, description, tags)
 *     - minPrice: number
 *     - maxPrice: number
 *     - limit:    number (default = all)
 *
 * POST /api/marketplace/listings
 *   Body: CreateListingRequest
 *   Creates a new listing under the current user's seller profile.
 *   Returns the created listing. Persists in module-scope memory.
 *
 * All responses include `source: 'mock'` per spec.
 */

const VALID_CATEGORIES: ListingCategory[] = [
  'video_scripts',
  'captions',
  'hashtag_sets',
  'thumbnail_designs',
  'live_scripts',
  'email_templates',
]

const VALID_PLATFORMS: ListingPlatform[] = ['shopee', 'tiktok', 'lazada', 'all']

const VALID_NICHES: ListingNiche[] = ['beauty', 'tech', 'fashion', 'home', 'food']

const VALID_SORTS: ListingSort[] = [
  'popular',
  'newest',
  'price_low',
  'price_high',
  'rating',
]

/**
 * In-memory store of listings created at runtime via POST.
 *
 * In production this would be a `MarketplaceListing` Prisma model
 * (CHECKLIST 4.2.1). For Fasa 4.2 we keep user-created listings in a
 * shared module-scope Map (see src/lib/marketplace/mock-data.ts) so they
 * round-trip between POST (create) and subsequent GET (browse) within the
 * same dev server process — including the [id] detail route.
 */

function allListings(): MarketplaceListing[] {
  return getAllListings()
}

function parseCategories(raw: string | null): ListingCategory[] | null {
  if (!raw) return null
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean) as ListingCategory[]
  return parts.filter((c) => VALID_CATEGORIES.includes(c))
}

function sortListings(
  listings: MarketplaceListing[],
  sort: ListingSort,
): MarketplaceListing[] {
  const arr = [...listings]
  switch (sort) {
    case 'newest':
      return arr.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    case 'price_low':
      return arr.sort((a, b) => a.price - b.price)
    case 'price_high':
      return arr.sort((a, b) => b.price - a.price)
    case 'rating':
      return arr.sort((a, b) => b.rating - a.rating || b.downloads - a.downloads)
    case 'popular':
    default:
      return arr.sort((a, b) => b.downloads - a.downloads)
  }
}

function matchesQuery(listing: MarketplaceListing, q: string): boolean {
  const needle = q.toLowerCase()
  return (
    listing.title.toLowerCase().includes(needle) ||
    listing.description.toLowerCase().includes(needle) ||
    listing.tags.some((t) => t.toLowerCase().includes(needle)) ||
    listing.sellerName.toLowerCase().includes(needle)
  )
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MarketplaceListingsResponse>> {
  try {
    const { searchParams } = new URL(request.url)

    const categories = parseCategories(searchParams.get('category'))
    const platform = (searchParams.get('platform') ?? 'all') as ListingPlatform
    const niche = (searchParams.get('niche') ?? 'all') as ListingNiche | 'all'
    const sort = (searchParams.get('sort') ?? 'popular') as ListingSort
    const q = searchParams.get('q')?.trim() ?? ''
    const minPrice = searchParams.has('minPrice')
      ? Number(searchParams.get('minPrice'))
      : 0
    const maxPrice = searchParams.has('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : Infinity
    const limit = searchParams.has('limit')
      ? Number(searchParams.get('limit'))
      : undefined

    // Validate sort.
    const safeSort = VALID_SORTS.includes(sort) ? sort : 'popular'
    const safePlatform = VALID_PLATFORMS.includes(platform) ? platform : 'all'
    const safeNiche =
      niche === 'all' || VALID_NICHES.includes(niche as ListingNiche)
        ? niche
        : 'all'

    let filtered = allListings().filter((l) => l.isActive)

    if (categories && categories.length > 0) {
      filtered = filtered.filter((l) => categories.includes(l.category))
    }

    if (safePlatform !== 'all') {
      filtered = filtered.filter(
        (l) => l.platform === safePlatform || l.platform === 'all',
      )
    }

    if (safeNiche !== 'all') {
      filtered = filtered.filter((l) => l.niche === safeNiche)
    }

    if (minPrice > 0 || maxPrice < Infinity) {
      filtered = filtered.filter((l) => l.price >= minPrice && l.price <= maxPrice)
    }

    if (q) {
      filtered = filtered.filter((l) => matchesQuery(l, q))
    }

    filtered = sortListings(filtered, safeSort)

    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit)
    }

    const featured = getFeaturedListings(5).map((l) => ({
      ...l,
      // Strip full content from list responses to keep payload small.
      content: undefined,
    }))

    // Strip full content from list responses (only the detail route exposes it).
    const listings = filtered.map((l) => ({ ...l, content: undefined }))

    const body: MarketplaceListingsResponse = {
      listings,
      total: listings.length,
      featured,
      categories: VALID_CATEGORIES,
      source: 'mock' as MarketplaceDataSource,
    }

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/marketplace/listings] error:', error)
    return NextResponse.json(
      {
        listings: [],
        total: 0,
        featured: [],
        categories: VALID_CATEGORIES,
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateListingResponse>> {
  try {
    let body: CreateListingRequest
    try {
      body = (await request.json()) as CreateListingRequest
    } catch {
      return NextResponse.json(
        {
          success: false,
          listing: null as unknown as MarketplaceListing,
          source: 'mock' as MarketplaceDataSource,
          error: 'Invalid JSON body.',
        },
        { status: 400 },
      )
    }

    // Validate required fields.
    const errors: string[] = []
    if (!body.title || body.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters.')
    }
    if (!body.description || body.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters.')
    }
    if (!VALID_CATEGORIES.includes(body.category)) {
      errors.push('Invalid category.')
    }
    if (!VALID_PLATFORMS.includes(body.platform)) {
      errors.push('Invalid platform.')
    }
    if (!VALID_NICHES.includes(body.niche)) {
      errors.push('Invalid niche.')
    }
    if (typeof body.price !== 'number' || body.price < 0 || body.price > 10000) {
      errors.push('Price must be a number between 0 and 10000.')
    }
    if (!body.previewSnippet || body.previewSnippet.trim().length < 10) {
      errors.push('Preview snippet must be at least 10 characters.')
    }
    if (!body.contentBody || body.contentBody.trim().length < 20) {
      errors.push('Content body must be at least 20 characters.')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          listing: null as unknown as MarketplaceListing,
          source: 'mock' as MarketplaceDataSource,
          error: errors.join(' '),
        },
        { status: 400 },
      )
    }

    // Build the new listing under the current user's seller profile.
    const seller = MOCK_SELLERS.find((s) => s.id === CURRENT_SELLER_ID)!
    const id = `lst-user-${Date.now()}`
    const now = new Date().toISOString()

    const listing: MarketplaceListing = {
      id,
      title: body.title.trim(),
      description: body.description.trim(),
      category: body.category,
      platform: body.platform,
      niche: body.niche,
      price: Math.round(body.price * 100) / 100,
      originalPrice: body.originalPrice,
      sellerId: CURRENT_SELLER_ID,
      sellerName: seller.name,
      sellerAvatar: seller.avatar,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      previewUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/400/300`,
      tags: body.tags ?? [],
      previewSnippet: body.previewSnippet.trim(),
      content: {
        body: body.contentBody.trim(),
        usageNotes:
          'Replace [PRODUCT], [PRICE], [BRAND], [AFFILIATE_LINK] with your own. Ganti [NAME] dengan nama sendiri untuk personal touch.',
      },
      features:
        body.features && body.features.length > 0
          ? body.features
          : ['Custom listing — features to be added by seller.'],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    userCreatedListings.set(id, listing)

    return NextResponse.json({
      success: true,
      listing,
      source: 'mock' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[POST /api/marketplace/listings] error:', error)
    return NextResponse.json(
      {
        success: false,
        listing: null as unknown as MarketplaceListing,
        source: 'mock' as MarketplaceDataSource,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create marketplace listing.',
      },
      { status: 500 },
    )
  }
}
