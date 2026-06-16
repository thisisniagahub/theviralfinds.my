import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPlan, getPrice, TIER_RANK } from '@/lib/pricing/plans'
import {
  getMockSubscription,
  setMockSubscription,
  resetUsageForTier,
} from '@/lib/pricing/mock-data'
import type { BillingCycle, PaymentMethod, PricingTier, Subscription, SubscriptionMutationRequest } from '@/lib/pricing/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pricing/subscription
 * Returns the demo user's current subscription state.
 * Auth-protected: falls back to a Free demo subscription if not signed in
 * (so the marketing page can still render upgrade CTAs).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const sub = getMockSubscription()

    // Stamp with the real user id if we have one (UI may show "Demo" otherwise).
    const userId = session?.user?.id ?? sub.userId
    return NextResponse.json({
      subscription: { ...sub, userId },
      source: 'mock' as const,
    })
  } catch (error) {
    console.error('[pricing/subscription GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to load subscription', source: 'mock' as const },
      { status: 500 },
    )
  }
}

/**
 * POST /api/pricing/subscription
 * Body: { action, targetTier?, billingCycle?, paymentMethod? }
 * Simulates an upgrade / downgrade / cancel / reactivate against the in-memory
 * mock store. In production this would be a Stripe/Billplz webhook call.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to manage your subscription.', source: 'mock' as const },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as SubscriptionMutationRequest
    const { action } = body
    if (!action || !['upgrade', 'downgrade', 'cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be upgrade | downgrade | cancel | reactivate.', source: 'mock' as const },
        { status: 400 },
      )
    }

    const current = getMockSubscription()

    let nextTier: PricingTier = current.tier
    let nextStatus: Subscription['status'] = current.status
    let nextBillingCycle: BillingCycle = current.billingCycle
    let nextPaymentMethod: PaymentMethod | null = current.paymentMethod
    let nextEnd: string | null = current.endDate
    let nextCancelledAt: string | null = current.cancelledAt
    let nextTrialEnd: string | null = current.trialEndsAt

    if (action === 'upgrade' || action === 'downgrade') {
      const target = body.targetTier as PricingTier | undefined
      if (!target || !['free', 'pro', 'business', 'enterprise'].includes(target)) {
        return NextResponse.json(
          { error: 'Invalid targetTier.', source: 'mock' as const },
          { status: 400 },
        )
      }

      // Validate direction (upgrade must go up, downgrade must go down).
      if (action === 'upgrade' && TIER_RANK[target] <= TIER_RANK[current.tier]) {
        return NextResponse.json(
          { error: `Upgrade must target a higher tier than ${current.tier}.`, source: 'mock' as const },
          { status: 400 },
        )
      }
      if (action === 'downgrade' && TIER_RANK[target] >= TIER_RANK[current.tier]) {
        return NextResponse.json(
          { error: `Downgrade must target a lower tier than ${current.tier}.`, source: 'mock' as const },
          { status: 400 },
        )
      }

      nextTier = target
      nextStatus = target === 'free' ? 'active' : 'active'
      if (body.billingCycle) nextBillingCycle = body.billingCycle
      if (body.paymentMethod) nextPaymentMethod = body.paymentMethod
      // Paid plans renew in 30 days (mock); free plans are perpetual.
      nextEnd = target === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      nextCancelledAt = null
      nextTrialEnd = null
    } else if (action === 'cancel') {
      nextStatus = 'cancelled'
      nextCancelledAt = new Date().toISOString()
      // Keep current tier until the period ends; afterwards the GET handler can downgrade to free.
      nextEnd = current.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (action === 'reactivate') {
      nextStatus = 'active'
      nextCancelledAt = null
      nextEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const plan = getPlan(nextTier)
    const monthly = getPrice(nextTier, 'monthly') ?? 0
    const amountRM = nextBillingCycle === 'yearly' ? getPrice(nextTier, 'yearly') ?? 0 : monthly

    const updated: Subscription = {
      ...current,
      tier: nextTier,
      status: nextStatus,
      billingCycle: nextBillingCycle,
      paymentMethod: nextPaymentMethod,
      endDate: nextEnd,
      cancelledAt: nextCancelledAt,
      trialEndsAt: nextTrialEnd,
      amountRM,
      updatedAt: new Date().toISOString(),
    }

    setMockSubscription(updated)

    // When tier changes, reset usage tracking so the demo shows clean counters
    // for the new tier (avoids "32/50" lingering on a Business unlimited card).
    if (nextTier !== current.tier) {
      resetUsageForTier(nextTier)
    }

    return NextResponse.json({
      subscription: updated,
      plan,
      message: `Subscription ${action} succeeded — you are now on the ${plan.name} plan.`,
      source: 'mock' as const,
    })
  } catch (error) {
    console.error('[pricing/subscription POST] error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription.', source: 'mock' as const },
      { status: 500 },
    )
  }
}
