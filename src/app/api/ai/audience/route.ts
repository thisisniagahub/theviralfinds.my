/**
 * AI Audience Analyzer — API route
 * Fasa 3.6 — TheViralFindsMY
 *
 * GET  /api/ai/audience          → returns full AudienceProfile
 * POST /api/ai/audience { niche } → returns profile refined by niche
 *
 * Uses z-ai-web-dev-sdk (BACKEND ONLY) to generate content suggestions
 * tailored to the audience. Falls back to the algorithmic mock data
 * when the SDK is unavailable or returns malformed output. The response
 * always carries `source: 'mock' | 'ai'`.
 */

import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

import { buildMockAudienceProfile } from '@/lib/audience/mock-data'
import type {
  AudienceApiResponse,
  AudienceProfile,
  ContentSuggestion,
} from '@/lib/audience/types'

/** Convert an MYT hour (0-23) into a friendly 12-hour label. */
function hourLabel(hour: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${ampm}`
}

/**
 * Ask Hermes (z-ai-web-dev-sdk) to refine content suggestions for the
 * given audience profile and optional niche. Returns `null` if anything
 * goes wrong so the caller can fall back to algorithmic suggestions.
 */
async function generateAiSuggestions(
  profile: AudienceProfile,
  niche?: string
): Promise<ContentSuggestion[] | null> {
  try {
    const zai = await ZAI.create()

    const audienceBrief = {
      totalSize: profile.summary.totalAudienceSize,
      topAgeRange: profile.demographics.ageRanges
        .slice()
        .sort((a, b) => b.percentage - a.percentage)[0]?.label,
      topGender: profile.demographics.genders
        .slice()
        .sort((a, b) => b.percentage - a.percentage)[0]?.label,
      topLocation: profile.demographics.locations[0]?.label,
      topDevice: profile.demographics.devices[0]?.label,
      topInterest: profile.interests.topInterest,
      peakHourLabel: profile.summary.peakHourLabel,
      avgEngagementRate: profile.summary.avgEngagementRate,
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a Shopee Malaysia affiliate marketing strategist. ' +
            'Based on the audience profile provided, return 3-6 content suggestions ' +
            'as a JSON array. Each item must have: id (string), title (string, ' +
            'punchy headline referencing audience data), explanation (string, 1-2 ' +
            'sentences with concrete numbers), format (one of: short_video, ' +
            'live_stream, carousel, story, blog_post), bestTime (string, MYT ' +
            'timing), expectedLift (number, percentage), tags (string array). ' +
            'Use Malaysian context (Klang Valley, Manglish, RM, 9.9 sale). ' +
            'Return ONLY the JSON array — no markdown, no commentary.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            audience: audienceBrief,
            topInterests: profile.interests.entries.slice(0, 5),
            segments: profile.segments.map((s) => ({
              name: s.name,
              share: s.sharePercentage,
              topInterest: s.topInterest,
              avgEngagement: s.avgEngagement,
            })),
            niche: niche || 'general',
          }),
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const allowedFormats: ContentSuggestion['format'][] = [
      'short_video',
      'live_stream',
      'carousel',
      'story',
      'blog_post',
    ]

    const suggestions: ContentSuggestion[] = parsed
      .filter((item) => typeof item.title === 'string')
      .slice(0, 6)
      .map((item, idx) => {
        const formatRaw = String(item.format || 'short_video')
        const format = allowedFormats.includes(formatRaw as ContentSuggestion['format'])
          ? (formatRaw as ContentSuggestion['format'])
          : 'short_video'

        const tagsRaw = Array.isArray(item.tags)
          ? (item.tags as unknown[]).map(String)
          : []

        return {
          id: typeof item.id === 'string' ? String(item.id) : `ai-sug-${idx + 1}`,
          title: String(item.title),
          explanation:
            typeof item.explanation === 'string'
              ? String(item.explanation)
              : 'Suggested based on your audience profile.',
          format,
          bestTime:
            typeof item.bestTime === 'string' ? String(item.bestTime) : '8 PM MYT',
          expectedLift:
            typeof item.expectedLift === 'number'
              ? item.expectedLift
              : Math.round((item.expectedLift as number) || 20),
          tags: tagsRaw.length > 0 ? tagsRaw : [niche || 'general'],
        }
      })

    return suggestions.length > 0 ? suggestions : null
  } catch (err) {
    console.error('[audience] AI suggestion generation failed:', err)
    return null
  }
}

/**
 * Build the audience profile. Tries to enrich content suggestions with
 * AI output; falls back to algorithmic suggestions otherwise.
 */
async function buildProfile(
  niche?: string,
  useAi = true
): Promise<AudienceApiResponse> {
  const baseProfile = buildMockAudienceProfile(niche)

  if (!useAi) {
    return { profile: baseProfile, source: 'mock', fallback: true }
  }

  const aiSuggestions = await generateAiSuggestions(baseProfile, niche)
  if (!aiSuggestions || aiSuggestions.length === 0) {
    return { profile: baseProfile, source: 'mock', fallback: true }
  }

  const profile: AudienceProfile = {
    ...baseProfile,
    suggestions: aiSuggestions,
    generatedAt: new Date().toISOString(),
  }

  return { profile, source: 'ai', fallback: false }
}

/** GET /api/ai/audience — returns the full audience analysis. */
export async function GET(_request: NextRequest) {
  try {
    const response = await buildProfile(undefined, true)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[audience] GET error:', error)
    // Final safety net — always return mock data with HTTP 200 so the UI
    // can render even if AI blew up.
    const fallback = buildMockAudienceProfile()
    return NextResponse.json({
      profile: fallback,
      source: 'mock',
      fallback: true,
    })
  }
}

/** POST /api/ai/audience — accepts `{ niche }` and returns refined analysis. */
export async function POST(request: NextRequest) {
  try {
    let body: { niche?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const niche =
      typeof body?.niche === 'string' ? body.niche.trim().slice(0, 60) : undefined

    const response = await buildProfile(niche, true)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[audience] POST error:', error)
    const fallback = buildMockAudienceProfile()
    return NextResponse.json({
      profile: fallback,
      source: 'mock',
      fallback: true,
    })
  }
}

/** Re-export hour label helper for callers that need it. */
export { hourLabel }
