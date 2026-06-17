import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPlan, getPrice } from '@/lib/pricing/plans'
import { buildMockCheckoutUrl } from '@/lib/pricing/mock-data'
import type { BillingCycle, CheckoutRequest, CheckoutSession, PaymentMethod, PricingTier } from '@/lib/pricing/types'

export const dynamic = 'force-dynamic'

const VALID_TIERS: PricingTier[] = ['free', 'pro', 'business', 'enterprise']
const VALID_CYCLES: BillingCycle[] = ['monthly', 'yearly']
const VALID_METHODS: PaymentMethod[] = ['stripe', 'billplz']

/**
 * POST /api/pricing/checkout
 * Body: { tier, billingCycle, paymentMethod, promoCode? }
 * Simulates Stripe / Billplz checkout session creation. In production this
 * would call the Stripe API (POST /v1/checkout/sessions) or Billplz API
 * (POST /api/v3/bills) and return the real hosted URL.
 *
 * For Free tier this returns a 400 — free users don't need a checkout.
 * For Enterprise tier this returns a 400 — must contact sales.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to start checkout.', source: 'mock' as const },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutRequest

    // ─── Validate ─────────────────────────────────────────────────────────
    if (!body.tier || !VALID_TIERS.includes(body.tier)) {
      return NextResponse.json(
        { error: 'Invalid tier.', source: 'mock' as const },
        { status: 400 },
      )
    }
    if (!body.billingCycle || !VALID_CYCLES.includes(body.billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billingCycle. Must be monthly or yearly.', source: 'mock' as const },
        { status: 400 },
      )
    }
    if (!body.paymentMethod || !VALID_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid paymentMethod. Must be stripe or billplz.', source: 'mock' as const },
        { status: 400 },
      )
    }

    // Free & Enterprise are special cases.
    if (body.tier === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require checkout.', source: 'mock' as const },
        { status: 400 },
      )
    }
    if (body.tier === 'enterprise') {
      return NextResponse.json(
        {
          error: 'Enterprise requires custom pricing. Please contact our sales team.',
          salesEmail: 'sales@theviralfindsmy.com',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // ─── Compute amount ───────────────────────────────────────────────────
    const plan = getPlan(body.tier)
    const amount = getPrice(body.tier, body.billingCycle)
    if (amount === null) {
      return NextResponse.json(
        { error: 'Could not determine price for the selected plan.', source: 'mock' as const },
        { status: 500 },
      )
    }

    // ─── Build mock checkout session ──────────────────────────────────────
    const { id, url } = buildMockCheckoutUrl(body.tier, body.paymentMethod)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min expiry (Stripe default)

    const checkoutSession: CheckoutSession = {
      id,
      url,
      tier: body.tier,
      billingCycle: body.billingCycle,
      paymentMethod: body.paymentMethod,
      amountRM: amount,
      currency: 'MYR',
      expiresAt: expiresAt.toISOString(),
      source: 'mock',
    }

    // In production:
    //  - Stripe: POST to https://api.stripe.com/v1/checkout/sessions with
    //    mode='subscription', line_items=[{price: STRIPE_PRICE_ID, quantity: 1}],
    //    success_url, cancel_url. Returns session.url.
    //  - Billplz: POST to https://www.billplz.com/api/v3/bills with
    //    collection_id, email, mobile, name, amount, description, callback_url,
    //    redirect_url. Returns bill.url.

    return NextResponse.json({
      checkout: checkoutSession,
      plan,
      message: `Redirecting to ${body.paymentMethod === 'stripe' ? 'Stripe' : 'Billplz'} checkout for ${plan.name} (${body.billingCycle}) — RM ${amount.toFixed(2)} ${body.billingCycle === 'yearly' ? '/year' : '/month'}`,
      source: 'mock' as const,
    })
  } catch (error) {
    console.error('[pricing/checkout POST] error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session.', source: 'mock' as const },
      { status: 500 },
    )
  }
}
