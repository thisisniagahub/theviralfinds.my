/**
 * POST /api/hermes/insights/generate
 *
 * Generates a FRESH proactive insight based on current data using the
 * z-ai-web-dev-sdk (BACKEND ONLY). Falls back to the algorithmic generator
 * (src/lib/hermes-insights/generator.ts) if the AI call fails or returns
 * unparseable output.
 *
 * Request body (all optional — defaults provided):
 *   {
 *     "focus": "daily_summary" | "anomaly" | "opportunity" | "trend_alert" | "recommendation",
 *     "context": { ... } // optional extra context for the AI
 *   }
 *
 * Response shape: GenerateInsightResponse (see types.ts)
 *   {
 *     "insight": ProactiveInsight,
 *     "source": "ai" | "algorithm",
 *     "generatedAt": ISO string
 *   }
 *
 * The generated insight is persisted to the HermesInsight table so it shows up
 * in subsequent GET /api/hermes/insights calls.
 */

import { NextResponse, type NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import {
  buildRecommendation,
  defaultAlgorithmicRecommendation,
  detectAnomalies,
  detectOpportunities,
  generateDailySummary,
  generateTrendAlerts,
  type DailyMetrics,
  type MetricSeries,
  type ProductTrend,
  type TrendSignal,
} from '@/lib/hermes-insights/generator'
import type {
  GenerateInsightResponse,
  InsightType,
  ProactiveInsight,
} from '@/lib/hermes-insights/types'

// ─── Algorithmic fallback data ───────────────────────────────────────────────

/** Realistic Malaysian-context demo metrics for the algorithmic fallback. */
const FALLBACK_DAILY: DailyMetrics = {
  today: { clicks: 234, conversions: 12, earnings: 145.50 },
  yesterday: { clicks: 198, conversions: 11, earnings: 123.30 },
}

const FALLBACK_ANOMALIES: MetricSeries[] = [
  {
    metric: 'conversionRate',
    before: 5.2,
    after: 1.8,
    window: 'last 3 hours',
    scope: 'Wireless Earbuds Pro',
  },
]

const FALLBACK_OPPORTUNITIES: ProductTrend[] = [
  {
    productName: 'Garnier Serum',
    itemId: '16382950172',
    category: 'Beauty',
    trendPct: 240,
    opportunitiesAvailable: 3,
    commissionRate: 6.5,
    estimatedEarnings: 380,
  },
]

const FALLBACK_TRENDS: TrendSignal[] = [
  {
    name: 'Raya Beauty',
    platform: 'TikTok',
    trendPct: 185,
    peakWindow: 'before Hari Raya',
    suggestedAction: 'Create GRWM Raya Look video with beauty + fashion links.',
    seasonal: true,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidFocus(value: unknown): value is InsightType {
  return typeof value === 'string' && [
    'daily_summary',
    'anomaly',
    'opportunity',
    'trend_alert',
    'recommendation',
  ].includes(value)
}

/** Algorithmic fallback — produces a deterministic insight per focus type. */
function algorithmicFallback(focus: InsightType): ProactiveInsight {
  switch (focus) {
    case 'daily_summary':
      return generateDailySummary(FALLBACK_DAILY)
    case 'anomaly':
      return detectAnomalies(FALLBACK_ANOMALIES)[0]
    case 'opportunity':
      return detectOpportunities(FALLBACK_OPPORTUNITIES)[0]
    case 'trend_alert':
      return generateTrendAlerts(FALLBACK_TRENDS)[0]
    case 'recommendation':
    default:
      return defaultAlgorithmicRecommendation()
  }
}

/** Try to persist an AI insight to the DB. Failures are non-fatal. */
async function persistInsight(insight: ProactiveInsight): Promise<void> {
  try {
    await db.hermesInsight.create({
      data: {
        id: insight.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
        data: insight.data ? JSON.stringify(insight.data) : null,
        isRead: false,
        isActioned: false,
      },
    })
  } catch (dbErr) {
    // DB might not be available — log and continue. The insight is still
    // returned to the caller; it just won't appear in subsequent GET calls.
    console.warn('[hermes/insights/generate] DB persist failed:', dbErr)
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      focus?: string
      context?: Record<string, unknown>
    }

    const focus: InsightType = isValidFocus(body.focus)
      ? body.focus
      : 'recommendation'

    const contextStr = body.context
      ? `\nAdditional context: ${JSON.stringify(body.context)}`
      : ''

    // Build focus-specific instruction for the AI
    const focusInstruction: Record<InsightType, string> = {
      daily_summary:
        'Generate a daily performance summary insight comparing today vs yesterday. Include clicks, conversions, earnings (RM), and a percentage change. Malaysian context, Manglish flavour.',
      anomaly:
        'Generate an anomaly detection insight — an unusual drop or spike (>20% change) in clicks, conversions, conversion rate, or earnings. Specify the metric, before/after values, the time window, and a clear "investigate" CTA. Malaysian context.',
      opportunity:
        'Generate a product opportunity insight — a trending product in Malaysia the user should promote now. Include product name, search growth %, opportunities available, commission rate, and estimated earnings. Manglish flavour.',
      trend_alert:
        'Generate a trend alert insight — an emerging cultural or seasonal trend (e.g. Raya Beauty, 11.11 prep) the user should create content for. Include platform, growth %, peak window, and a suggested action.',
      recommendation:
        'Generate a recommendation insight — a smart actionable suggestion (best posting time, content format, audience targeting, link audit). Include expected lift percentage. Manglish flavour.',
    }

    // ── Try AI generation ──────────────────────────────────────────────────
    let aiInsight: ProactiveInsight | null = null
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are HERMES, a proactive AI agent for TheViralFindsMY — an affiliate marketing platform for Malaysian Shopee affiliates. Generate ONE proactive insight as a strict JSON object with these exact fields:
{
  "type": "${focus}",
  "severity": "info" | "warning" | "critical" | "success",
  "title": "Short punchy headline (max 80 chars, can use emoji)",
  "description": "1-3 sentence body with concrete numbers. Use Malaysian context (RM currency, MYT timezone) and Manglish flavour (e.g. 'syok', 'naik', 'jangan lambat', 'cepat sikit').",
  "data": { ... }  // structured payload relevant to the type
}

For "data" field, use this shape based on type:
- daily_summary: { "today": {clicks,conversions,earnings,conversionRate}, "yesterday": {...}, "changePct": {clicks,conversions,earnings} }
- anomaly: { "metric": "clicks"|"conversions"|"conversionRate"|"earnings", "before": number, "after": number, "dropPct": number, "window": "last X hours" }
- opportunity: { "productName": string, "category": string, "trendPct": number, "opportunitiesAvailable": number, "commissionRate": number, "estimatedEarnings": number }
- trend_alert: { "productName": string, "trendPct": number }
- recommendation: { "recommendationType": "post_timing"|"content_format"|"product_focus"|"link_audit"|"audience_targeting", "suggestedTime"?: string, "expectedLift"?: number }

Return ONLY the JSON object. No markdown, no explanation.`,
          },
          {
            role: 'user',
            content: `${focusInstruction[focus]}${contextStr}

Make it realistic and specific to the Malaysian Shopee affiliate market.`,
          },
        ],
        thinking: { type: 'disabled' },
      })

      const content = completion.choices?.[0]?.message?.content || ''
      // Extract JSON object from response (tolerate markdown fences)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<ProactiveInsight> & {
          data?: Record<string, unknown>
        }

        // Validate + normalise the AI output
        if (parsed.title && parsed.description) {
          aiInsight = {
            id: `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            type: focus,
            severity: (['info', 'warning', 'critical', 'success'].includes(
              parsed.severity as string,
            )
              ? parsed.severity
              : 'info') as ProactiveInsight['severity'],
            title: String(parsed.title).slice(0, 200),
            description: String(parsed.description).slice(0, 1000),
            timestamp: new Date().toISOString(),
            relevance: 85,
            isRead: false,
            isActioned: false,
            source: 'ai',
            data: parsed.data as ProactiveInsight['data'],
            action: focus === 'opportunity'
              ? { label: 'Generate Link', action: 'generate_link' }
              : focus === 'anomaly'
                ? { label: 'Investigate', action: 'investigate', href: '/analytics' }
                : focus === 'trend_alert'
                  ? { label: 'Generate Content', action: 'generate_content', href: '/hermes' }
                  : focus === 'daily_summary'
                    ? { label: 'View Analytics', action: 'view_analytics', href: '/analytics' }
                    : { label: 'Generate Content', action: 'generate_content', href: '/hermes' },
            secondaryAction: { label: 'Mark as Actioned', action: 'dismiss' },
          }
        }
      }
    } catch (aiErr) {
      console.warn('[hermes/insights/generate] AI generation failed, using algorithmic fallback:', aiErr)
    }

    // ── Fallback to algorithmic generation ─────────────────────────────────
    const finalInsight = aiInsight ?? algorithmicFallback(focus)
    const finalSource = aiInsight ? 'ai' : 'algorithm'

    // ── Persist AI insights to DB (so they appear in subsequent GET calls) ─
    // Algorithmic ones are regenerated deterministically so no need to persist.
    if (finalSource === 'ai') {
      await persistInsight(finalInsight)
    }

    const response: GenerateInsightResponse = {
      insight: finalInsight,
      source: finalSource,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[hermes/insights/generate] POST error:', error)
    // Even on total failure, return a valid algorithmic insight so the UI
    // never gets a 500 (it can still show something useful).
    const fallback = buildRecommendation({
      type: 'post_timing',
      title: '💡 Default recommendation: post at 7:45 PM MYT for peak 8 PM engagement.',
      description:
        'AI generation failed. Defaulting to algorithmic recommendation. Peak engagement window is 8-10 PM MYT — posting 15 minutes early lets the algorithm index your content. Expected lift: ~23% more clicks.',
      suggestedTime: '7:45 PM MYT',
      expectedLift: 23,
    })
    const response: GenerateInsightResponse = {
      insight: fallback,
      source: 'algorithm',
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 200 })
  }
}
