import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { abTestingStore } from '@/lib/abtesting/mock-data'
import type { AbTestResult, ContentVariant, ListResponse, TrackResponse } from '@/lib/abtesting/types'

// ─── POST validation ───────────────────────────────────────────────────────

const trackSchema = z.object({
  variantId: z.string().min(1, 'variantId is required'),
  actualClicks: z.number().int().min(0, 'actualClicks must be >= 0'),
  actualConversions: z.number().int().min(0, 'actualConversions must be >= 0'),
})

/**
 * Locate a variant across all tests in the store.
 * Returns the test and variant index, or null if not found.
 */
function findVariant(variantId: string): { test: AbTestResult; variant: ContentVariant; vIndex: number } | null {
  for (const test of abTestingStore.tests.values()) {
    const vIndex = test.variants.findIndex((v) => v.id === variantId)
    if (vIndex >= 0) {
      return { test, variant: test.variants[vIndex], vIndex }
    }
  }
  return null
}

/**
 * Compute an "actual score" from logged performance.
 *
 * Heuristic: blend CTR (conversion rate) with raw volume.
 * - CTR component: clamp(CTR * 4, 0, 80) — 20% CTR maps to ~80
 * - Volume component: clamp(log10(clicks + 1) * 6, 0, 20) — 1000 clicks ≈ 18
 *
 * This intentionally differs from the predicted score (which is content-based)
 * so the dashboard can compare "what AI predicted" vs "what actually happened".
 */
function computeActualScore(clicks: number, conversions: number): number {
  const ctr = clicks > 0 ? (conversions / clicks) * 100 : 0
  const ctrComponent = Math.min(ctr * 4, 80)
  const volumeComponent = Math.min(Math.log10(clicks + 1) * 6, 20)
  return Math.round(ctrComponent + volumeComponent)
}

// ─── POST handler — log actual performance for a variant ───────────────────

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const { variantId, actualClicks, actualConversions } = await trackSchema.parseAsync(
      await request.json()
    )

    const found = findVariant(variantId)
    if (!found) {
      throw ApiError.notFound(`Variant ${variantId} not found. Generate a test first.`)
    }

    const { test, vIndex } = found
    const ctr = actualClicks > 0 ? (actualConversions / actualClicks) * 100 : 0
    const updatedVariant: ContentVariant = {
      ...test.variants[vIndex],
      actual: {
        clicks: actualClicks,
        conversions: actualConversions,
        ctr: Math.round(ctr * 10) / 10,
        loggedAt: new Date().toISOString(),
      },
    }

    const updatedVariants = [...test.variants]
    updatedVariants[vIndex] = updatedVariant

    // Determine / refresh the winner: the variant with the highest CTR
    // (only among variants that have logged actual performance).
    let winnerId: string | null = null
    let bestCtr = -1
    for (const v of updatedVariants) {
      if (v.actual && v.actual.ctr > bestCtr) {
        bestCtr = v.actual.ctr
        winnerId = v.id
      }
    }
    const updatedVariantsWithWinner = updatedVariants.map((v) => ({
      ...v,
      isWinner: v.id === winnerId,
    }))

    const updatedTest: AbTestResult = {
      ...test,
      variants: updatedVariantsWithWinner,
      winnerVariantId: winnerId,
    }

    abTestingStore.tests.set(test.id, updatedTest)

    const response: TrackResponse = {
      variant: updatedVariantsWithWinner[vIndex],
      test: updatedTest,
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return handleError(error)
  }
}

// ─── GET handler — list all A/B tests ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')

    let tests = Array.from(abTestingStore.tests.values())
    if (productId) {
      tests = tests.filter((t) => t.id === productId || t.product.toLowerCase().includes(productId.toLowerCase()))
    }

    // Newest first
    tests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const response: ListResponse = {
      tests,
      total: tests.length,
    }
    return NextResponse.json(response)
  } catch (error) {
    return handleError(error)
  }
}
