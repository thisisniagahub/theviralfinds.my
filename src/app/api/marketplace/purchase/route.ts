import { NextRequest, NextResponse } from 'next/server'

import {
  MARKETPLACE_FEE_PERCENT,
  type MarketplaceDataSource,
  type PaymentMethod,
  type Purchase,
  type PurchaseRequest,
  type PurchaseResponse,
} from '@/lib/marketplace/types'
import { findListingById } from '@/lib/marketplace/mock-data'

/**
 * Affiliate Content Marketplace — Purchase API
 *
 * Fasa 4.2 (CHECKLIST 4.2.5).
 *
 * POST /api/marketplace/purchase
 *   Body: { listingId: string, paymentMethod: 'stripe' | 'billplz' }
 *
 * Returns a mock purchase confirmation with a download URL. The download
 * URL is a synthetic `marketplace://download/...` link — in production
 * this would be a signed S3 / CloudFront URL that expires after 24h.
 *
 * Marketplace fee: 15% (deducted from seller payout).
 *
 * Side effect: increments the listing's `downloads` counter so the
 * seller dashboard reflects the new sale. The increment is stored in a
 * module-scope map so the dashboard reflects it across requests.
 */

/** Map of listingId → number of in-session purchases (for live download counts). */
const purchaseCount = new Map<string, number>()

/** Map of purchaseId → Purchase record (for seller dashboard recentSales). */
const purchases = new Map<string, Purchase>()

/** Map of listingId → isPurchased (so the UI can show "Owned" state). */
const ownedListings = new Set<string>()

const VALID_METHODS: PaymentMethod[] = ['stripe', 'billplz']

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<PurchaseResponse | { error: string; source: MarketplaceDataSource }>> {
  try {
    let body: PurchaseRequest
    try {
      body = (await request.json()) as PurchaseRequest
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    if (!body.listingId || typeof body.listingId !== 'string') {
      return NextResponse.json(
        {
          error: 'Field "listingId" is required.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    if (!VALID_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json(
        {
          error: 'Field "paymentMethod" must be one of: stripe, billplz.',
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 400 },
      )
    }

    const listing = findListingById(body.listingId)
    if (!listing || !listing.isActive) {
      return NextResponse.json(
        {
          error: `Listing "${body.listingId}" not found or no longer available.`,
          source: 'mock' as MarketplaceDataSource,
        },
        { status: 404 },
      )
    }

    // Compute amounts.
    const amount = Math.round(listing.price * 100) / 100
    const fee = Math.round((amount * MARKETPLACE_FEE_PERCENT) / 100 * 100) / 100
    const sellerPayout = Math.round((amount - fee) * 100) / 100

    // Mock payment processing delay (instant in mock mode).
    const purchaseId = generateId('purchase')
    const downloadUrl = `marketplace://download/${listing.id}/${purchaseId}`

    const purchase: Purchase = {
      id: purchaseId,
      listingId: listing.id,
      listingTitle: listing.title,
      buyerName: 'You',
      amount,
      fee,
      sellerPayout,
      paymentMethod: body.paymentMethod,
      downloadUrl,
      purchasedAt: new Date().toISOString(),
      status: 'completed',
    }

    // Persist.
    purchases.set(purchaseId, purchase)
    ownedListings.add(listing.id)
    purchaseCount.set(
      listing.id,
      (purchaseCount.get(listing.id) ?? 0) + 1,
    )

    // Return the listing with `isPurchased: true` so the UI can switch to
    // "Download" mode.
    const purchasedListing = {
      ...listing,
      isPurchased: true,
      downloads: listing.downloads + (purchaseCount.get(listing.id) ?? 0),
    }

    const response: PurchaseResponse = {
      success: true,
      purchase,
      listing: purchasedListing,
      source: 'mock' as MarketplaceDataSource,
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[POST /api/marketplace/purchase] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process purchase.',
        source: 'mock' as MarketplaceDataSource,
      },
      { status: 500 },
    )
  }
}

/** Returns whether a listing has been purchased in this session. */
export function isListingOwned(listingId: string): boolean {
  return ownedListings.has(listingId)
}

/** Returns all purchases made in this session (for seller dashboard). */
export function getSessionPurchases(): Purchase[] {
  return Array.from(purchases.values())
}
