import { NextRequest, NextResponse } from 'next/server'

import {
  CURRENT_SELLER_ID,
  type CreateSellerRequest,
  type CreateSellerResponse,
  type MarketplaceDataSource,
  type MarketplaceListing,
  type SellerDashboard,
  type SellerProfile,
} from '@/lib/marketplace/types'
import {
  MOCK_SELLERS,
  buildSellerDashboard,
  findListingsBySeller,
} from '@/lib/marketplace/mock-data'
import { getSessionPurchases } from '@/app/api/marketplace/purchase/route'

/**
 * Affiliate Content Marketplace — Seller API
 *
 * Fasa 4.2 (CHECKLIST 4.2.6, 4.2.7).
 *
 * GET  /api/marketplace/seller
 *   Query: ?sellerId={id} (defaults to current user)
 *   Returns the seller dashboard aggregate: profile, listings, recent
 *   sales, monthly chart data, totals (earnings, sales, avg rating,
 *   pending payout).
 *
 * POST /api/marketplace/seller
 *   Body: { name, bio, avatar? }
 *   Creates (or updates) the current user's seller profile.
 *
 * All responses include `source: 'mock'` per spec.
 */

/**
 * In-memory store for the current user's seller profile. Defaults to the
 * pre-built `CURRENT_SELLER_ID` profile from mock-data. Updated via POST.
 */
let currentUserProfile: SellerProfile =
  MOCK_SELLERS.find((s) => s.id === CURRENT_SELLER_ID)!

export async function GET(
  request: NextRequest,
): Promise<NextResponse<SellerDashboard | { error: string; source: MarketplaceDataSource }>> {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId') ?? CURRENT_SELLER_ID

    // Use the live current-user profile if requesting the current user.
    const profile = sellerId === CURRENT_SELLER_ID ? currentUserProfile : (
      MOCK_SELLERS.find((s) => s.id === sellerId) ?? MOCK_SELLERS[0]
    )

    // Get listings owned by this seller.
    const listings: MarketplaceListing[] = findListingsBySeller(sellerId)

    // Get recent purchases (only for current user — we only track those).
    const recentSales = sellerId === CURRENT_SELLER_ID
      ? getSessionPurchases()
          .filter((p) =>
            listings.some((l) => l.id === p.listingId),
          )
          .slice(0, 10)
      : []

    // Build the dashboard aggregate.
    const base = buildSellerDashboard(sellerId)

    // If the current user has created listings at runtime, override
    // `listings` with the live list (which includes user-created entries).
    const dashboard: SellerDashboard = {
      profile,
      listings: listings.length > 0 ? listings : base.listings,
      recentSales,
      monthly: base.monthly,
      totalEarnings: base.totalEarnings,
      totalSales: base.totalSales,
      avgRating: base.avgRating,
      pendingPayout: base.pendingPayout,
      source: 'mock' as MarketplaceDataSource,
    }

    return NextResponse.json(dashboard, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/marketplace/seller] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch seller dashboard.',
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateSellerResponse | { error: string; source: MarketplaceDataSource }>> {
  try {
    let body: CreateSellerRequest
    try {
      body = (await request.json()) as CreateSellerRequest
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        {
          error: 'Name must be at least 2 characters.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    if (!body.bio || body.bio.trim().length < 10) {
      return NextResponse.json(
        {
          error: 'Bio must be at least 10 characters.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    // Update the current user's seller profile (preserves stats + joinedAt).
    currentUserProfile = {
      ...currentUserProfile,
      name: body.name.trim(),
      bio: body.bio.trim(),
      avatar: body.avatar?.trim() || currentUserProfile.avatar,
    }

    return NextResponse.json({
      success: true,
      profile: currentUserProfile,
      source: 'mock' as MarketplaceDataSource,
    })
  } catch (error) {
    console.error('[POST /api/marketplace/seller] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create seller profile.',
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}
