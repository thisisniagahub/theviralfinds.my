import { NextRequest, NextResponse } from 'next/server'

import {
  CURRENT_SELLER_ID,
  type MarketplaceDataSource,
  type MarketplaceListing,
  type MarketplaceListingDetailResponse,
  type UpdateListingRequest,
} from '@/lib/marketplace/types'
import {
  findListingById,
  getRelatedListings,
  getReviewsForListing,
  userCreatedListings,
} from '@/lib/marketplace/mock-data'

/**
 * Affiliate Content Marketplace — Listing Detail API
 *
 * Fasa 4.2 (CHECKLIST 4.2.4, 4.2.10).
 *
 * GET    /api/marketplace/listings/[id]
 *   Returns the full listing (including `content` body for watermarked
 *   preview), its reviews, and 4 related listings.
 *
 * PATCH  /api/marketplace/listings/[id]
 *   Body: Partial<UpdateListingRequest>
 *   Updates a listing owned by the current user (seller-me).
 *   Mock seed listings (seller-01..08) cannot be patched — returns 403.
 *
 * DELETE /api/marketplace/listings/[id]
 *   Soft-deletes (sets isActive=false) a listing owned by the current user.
 *
 * All responses include `source: 'mock'` per spec.
 */

function isOwnedByCurrentUser(listing: MarketplaceListing): boolean {
  return listing.sellerId === CURRENT_SELLER_ID
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<
  NextResponse<
    MarketplaceListingDetailResponse | { error: string; source: MarketplaceDataSource }
  >
> {
  try {
    const { id } = await params
    const listing = findListingById(id)

    if (!listing || !listing.isActive) {
      return NextResponse.json(
        {
          error: `Listing "${id}" not found.`,
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    const reviews = getReviewsForListing(id)
    const related = getRelatedListings(listing, 4).map((l) => ({
      ...l,
      content: undefined,
    }))

    // The detail route returns the full content (for watermarked preview).
    // The UI overlays a watermark on the previewSnippet and reveals the
    // full content body only after purchase (CHECKLIST 4.2.10).
    const body: MarketplaceListingDetailResponse = {
      listing,
      reviews,
      related,
      source: 'mock' as MarketplaceDataSource,
    }

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/marketplace/listings/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch listing.',
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    const listing = findListingById(id)

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: `Listing "${id}" not found.`,
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    if (!isOwnedByCurrentUser(listing)) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only edit listings you own.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 403 },
      )
    }

    let body: UpdateListingRequest
    try {
      body = (await request.json()) as UpdateListingRequest
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    // Apply updates — only user-created listings are mutable.
    const existing = userCreatedListings.get(id)
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mock seed listings cannot be edited. Create your own via POST.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 403 },
      )
    }

    const updated: MarketplaceListing = {
      ...existing,
      title: body.title?.trim() ?? existing.title,
      description: body.description?.trim() ?? existing.description,
      price: typeof body.price === 'number' ? body.price : existing.price,
      originalPrice: body.originalPrice ?? existing.originalPrice,
      previewSnippet: body.previewSnippet?.trim() ?? existing.previewSnippet,
      features: body.features ?? existing.features,
      tags: body.tags ?? existing.tags,
      isActive: body.isActive ?? existing.isActive,
      content: body.contentBody
        ? {
            body: body.contentBody.trim(),
            usageNotes: existing.content?.usageNotes,
          }
        : existing.content,
      updatedAt: new Date().toISOString(),
    }

    userCreatedListings.set(id, updated)

    return NextResponse.json({
      success: true,
      listing: updated,
      source: 'mock' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[PATCH /api/marketplace/listings/[id]] error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update listing.',
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    const listing = findListingById(id)

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: `Listing "${id}" not found.`,
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    if (!isOwnedByCurrentUser(listing)) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only delete listings you own.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 403 },
      )
    }

    const existing = userCreatedListings.get(id)
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mock seed listings cannot be deleted. Create your own via POST.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 403 },
      )
    }

    // Soft-delete: mark inactive.
    userCreatedListings.set(id, { ...existing, isActive: false })

    return NextResponse.json({
      success: true,
      source: 'mock' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[DELETE /api/marketplace/listings/[id]] error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete listing.',
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}
