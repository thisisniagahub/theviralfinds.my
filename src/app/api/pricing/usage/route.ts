import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMockSubscription, getMockUsage, incrementMockUsage } from '@/lib/pricing/mock-data'
import { checkUsageLimit, getUpgradePrompt } from '@/lib/pricing/feature-gate'
import type { FeatureKey, UsageIncrementRequest } from '@/lib/pricing/types'

export const dynamic = 'force-dynamic'

const VALID_FEATURES: FeatureKey[] = [
  'products',
  'links',
  'content',
  'platforms',
  'analytics',
  'ai_content',
  'ab_testing',
  'audience_analyzer',
  'team_members',
  'api_access',
  'priority_support',
  'white_label',
  'custom_integrations',
  'sla',
  'dedicated_support',
]

/**
 * GET /api/pricing/usage
 * Returns the demo user's usage metrics for the current period.
 * Auth-protected — anonymous callers get 401.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to view usage.', source: 'mock' as const },
        { status: 401 },
      )
    }

    const sub = getMockSubscription()
    const usage = getMockUsage()

    // Decorate each metric with the gating result so the UI can render
    // "X / Y — Upgrade" inline.
    const metricsWithGate = usage.metrics.map((m) => {
      const gate = checkUsageLimit(sub.tier, m.feature, m.count)
      const prompt = !gate.allowed ? getUpgradePrompt(sub.tier, m.feature, m.count) : null
      return { ...m, gate, upgradePrompt: prompt }
    })

    return NextResponse.json({
      usage: { ...usage, metrics: metricsWithGate },
      tier: sub.tier,
      source: 'mock' as const,
    })
  } catch (error) {
    console.error('[pricing/usage GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to load usage.', source: 'mock' as const },
      { status: 500 },
    )
  }
}

/**
 * POST /api/pricing/usage
 * Body: { feature, delta? }
 * Increments a usage counter and returns the gate result + upgrade prompt
 * (if the user just hit their limit). Used by the usage tracking middleware
 * (CHECKLIST 4.1.3) — every metered API call should hit this endpoint first.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to track usage.', source: 'mock' as const },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as UsageIncrementRequest
    if (!body.feature || !VALID_FEATURES.includes(body.feature)) {
      return NextResponse.json(
        { error: 'Invalid feature key.', source: 'mock' as const },
        { status: 400 },
      )
    }

    const delta = typeof body.delta === 'number' && body.delta > 0 ? body.delta : 1
    const sub = getMockSubscription()

    // Pre-check: is the user allowed to perform one more?
    const beforeUsage = getMockUsage()
    const currentMetric = beforeUsage.metrics.find((m) => m.feature === body.feature)
    const currentCount = currentMetric?.count ?? 0

    const preGate = checkUsageLimit(sub.tier, body.feature, currentCount)
    if (!preGate.allowed) {
      // Return the upgrade prompt so the client can show a dialog.
      const prompt = getUpgradePrompt(sub.tier, body.feature, currentCount)
      return NextResponse.json({
        allowed: false,
        reason: preGate.reason,
        usage: beforeUsage,
        upgradePrompt: prompt,
        source: 'mock' as const,
      }, { status: 402 }) // 402 Payment Required — upgrade needed
    }

    // Increment the counter.
    const updatedUsage = incrementMockUsage(body.feature, delta)
    const newMetric = updatedUsage.metrics.find((m) => m.feature === body.feature)
    const postGate = checkUsageLimit(sub.tier, body.feature, newMetric?.count ?? 0)
    const prompt = !postGate.allowed
      ? getUpgradePrompt(sub.tier, body.feature, newMetric?.count ?? 0)
      : null

    return NextResponse.json({
      allowed: true,
      usage: updatedUsage,
      gate: postGate,
      upgradePrompt: prompt,
      source: 'mock' as const,
    })
  } catch (error) {
    console.error('[pricing/usage POST] error:', error)
    return NextResponse.json(
      { error: 'Failed to increment usage.', source: 'mock' as const },
      { status: 500 },
    )
  }
}
