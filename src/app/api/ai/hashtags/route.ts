import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import {
  HASHTAG_DATABASE,
  NICHE_LABELS,
  PLATFORM_LABELS,
  getMockAnalytics,
} from '@/lib/hashtags/mock-data'
import {
  calculateOverallScore,
  explainScore,
  filterCandidates,
} from '@/lib/hashtags/scorer'
import type {
  HashtagNiche,
  HashtagOptimizeResponse,
  HashtagPlatform,
  HashtagSuggestion,
  HashtagAnalytics,
} from '@/lib/hashtags/types'

/** Body validation for POST /api/ai/hashtags */
const optimizeSchema = z.object({
  niche: z.enum(['beauty', 'tech', 'fashion', 'food', 'home']),
  contentKeywords: z.array(z.string().max(60)).max(20).default([]),
  platform: z.enum(['tiktok', 'instagram', 'facebook']),
})

/**
 * Algorithmic suggestion engine — runs locally on the mock DB.
 * Always available as a fallback when the AI call fails or times out.
 *
 * Returns top-N suggestions sorted by overall score.
 */
function algorithmicSuggest(
  niche: HashtagNiche,
  platform: HashtagPlatform,
  contentKeywords: string[],
  limit = 15
): HashtagSuggestion[] {
  const candidates = filterCandidates(HASHTAG_DATABASE, niche, platform)
  const scored = candidates.map((h) => {
    const score = calculateOverallScore(h, niche, contentKeywords)
    return {
      tag: h.tag,
      platform: h.platform,
      niche: h.niche,
      impressions: h.impressions,
      avgClicks: h.avgClicks,
      competition: h.competition,
      trendDirection: h.trendDirection,
      trendPercent: h.trendPercent,
      reach: score.reach,
      competitionScore: score.competitionScore,
      relevance: score.relevance,
      overall: score.overall,
      explanation: explainScore(h, score, niche, contentKeywords),
    } as HashtagSuggestion
  })
  return scored.sort((a, b) => b.overall - a.overall).slice(0, limit)
}

/**
 * Try to refine the algorithmic suggestions with the AI. We hand the AI
 * the top 15 candidates + the user's niche / keywords, and ask it to:
 *   - re-rank them
 *   - pick the best 15 for the user's content angle
 *   - add a one-line strategy tip
 *
 * If the AI fails, returns `null` so the caller falls back to the pure
 * algorithmic ranking. Never throws.
 */
async function refineWithAI(
  niche: HashtagNiche,
  platform: HashtagPlatform,
  contentKeywords: string[],
  algorithmic: HashtagSuggestion[]
): Promise<{ suggestions: HashtagSuggestion[]; aiTip: string } | null> {
  try {
    const zai = await ZAI.create()

    const candidateSummary = algorithmic
      .map((s, i) => `${i + 1}. #${s.tag} — score ${s.overall}, reach ${s.reach}, competition ${s.competition}, relevance ${s.relevance}, impressions ${s.impressions}, trend ${s.trendDirection} ${s.trendPercent}%`)
      .join('\n')

    const systemPrompt = `You are a Malaysian social media hashtag strategist for Shopee / TikTok / Instagram affiliates.

You will receive:
- A content niche (${NICHE_LABELS[niche]})
- A target platform (${PLATFORM_LABELS[platform].label})
- Content keywords the user typed: ${contentKeywords.length > 0 ? contentKeywords.join(', ') : '(none provided)'}
- A pre-ranked list of 15 candidate hashtags with their algorithmic scores

Your job:
1. Re-rank the candidates based on what will actually perform best for THIS specific content angle (keywords + platform + niche). Use Malaysian market intuition — TikTok rewards trend + entertainment value, Instagram rewards aesthetic / aspirational tags, Facebook rewards practical / community tags.
2. Return the re-ranked list as a JSON array of objects with this exact shape:
   { "tag": "SkincareMY", "explanation": "short reason in <120 chars" }
   — only include tags from the candidate list
   — keep the explanation crisp and Malaysian-friendly (mix of BM + English ok)
3. Separately, write a one-line strategy tip (<200 chars) telling the user how to mix these hashtags for best results.

Return ONLY valid JSON in this exact shape:
{ "reranked": [ { "tag": "...", "explanation": "..." } ], "tip": "..." }

No markdown, no commentary outside the JSON.`

    const completion = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: candidateSummary },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content || ''
    if (!raw) return null

    // Strip any markdown code fences if the model wrapped the JSON.
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')

    const parsed = JSON.parse(cleaned) as {
      reranked?: Array<{ tag: string; explanation: string }>
      tip?: string
    }

    if (!parsed || !Array.isArray(parsed.reranked) || parsed.reranked.length === 0) {
      return null
    }

    // Build a lookup so we can pull the full metric block per tag.
    const byTag = new Map(algorithmic.map((s) => [s.tag, s]))
    const refined: HashtagSuggestion[] = []
    for (const item of parsed.reranked) {
      const base = byTag.get(item.tag)
      if (!base) continue
      refined.push({
        ...base,
        explanation: item.explanation || base.explanation,
      })
      if (refined.length >= 15) break
    }

    if (refined.length === 0) return null

    return {
      suggestions: refined,
      aiTip: parsed.tip?.trim() || undefined,
    }
  } catch (err) {
    console.warn('[/api/ai/hashtags] AI refine failed, falling back to algorithmic:', err)
    return null
  }
}

/**
 * POST /api/ai/hashtags
 *
 * Body: { niche, contentKeywords[], platform }
 * Returns: top 15 scored hashtag suggestions + AI strategy tip.
 *
 * Flow:
 *   1. Validate input
 *   2. Compute algorithmic suggestions (always succeeds)
 *   3. Try to refine with z-ai-web-dev-sdk
 *   4. Return AI-refined list if available, else algorithmic
 *   5. Always include `source: 'ai' | 'mock'`
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const parsed = optimizeSchema.safeParse(body)
    if (!parsed.success) {
      throw ApiError.badRequest(
        'Validation failed. Expected { niche, contentKeywords[], platform }.',
        parsed.error.issues
      )
    }
    const { niche, contentKeywords, platform } = parsed.data

    // 1. Always compute algorithmic baseline (fallback).
    const algorithmic = algorithmicSuggest(niche, platform, contentKeywords, 15)
    if (algorithmic.length === 0) {
      throw ApiError.internal('No hashtag candidates available for this niche/platform.')
    }

    // 2. Try to refine with AI.
    const refined = await refineWithAI(niche, platform, contentKeywords, algorithmic)

    const response: HashtagOptimizeResponse = refined
      ? {
          niche,
          platform,
          contentKeywords,
          suggestions: refined.suggestions,
          source: 'ai',
          aiTip: refined.aiTip,
        }
      : {
          niche,
          platform,
          contentKeywords,
          suggestions: algorithmic,
          source: 'mock',
        }

    return NextResponse.json(response)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/ai/hashtags
 *
 * Returns the user's hashtag analytics dashboard payload:
 *   - performance over time (weekly aggregates)
 *   - top performing hashtags from history
 *   - competition vs reach scatter plot data
 *
 * Currently backed by mock data; will be DB-backed when the
 * HashtagPerformance Prisma model lands in a later iteration.
 */
export async function GET() {
  const analytics: HashtagAnalytics = getMockAnalytics()
  return NextResponse.json(analytics)
}
