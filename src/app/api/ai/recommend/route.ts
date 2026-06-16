/**
 * AI Product Recommender — API Route
 *
 * GET /api/ai/recommend?audience=beauty_mama&limit=12&refresh=1
 *
 * Returns top-N recommended products for the given audience persona, scored
 * by the weighted algorithm (audience 40% + commission 30% + trend 20% + gap 10%).
 *
 * Uses z-ai-web-dev-sdk (BACKEND ONLY) to enhance the per-product explanations
 * with natural-language Manglish summaries. Falls back to algorithmic
 * explanations if the AI call fails or times out.
 *
 * Always includes `source: 'mock' | 'ai'` and `aiEnhanced: boolean` fields.
 */

import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

import { ShopeeMockService } from '@/lib/shopee/mock-data'
import { getTikTokMockService } from '@/lib/tiktok/mock-data'
import { LazadaMockService } from '@/lib/lazada/mock-data'

import {
  ALGORITHM_VERSION,
  calculateRecommendation,
  rankRecommendations,
} from '@/lib/recommender/algorithm'
import { getAudienceProfile } from '@/lib/recommender/mock-data'
import type {
  AudiencePersonaId,
  RecommendableProduct,
  Recommendation,
  RecommendationResponse,
  Platform,
} from '@/lib/recommender/types'

// ─── Singleton mock services (stable across requests) ──────────

const shopeeMock = new ShopeeMockService()
const tiktokMock = getTikTokMockService()
const lazadaMock = new LazadaMockService()

// ─── In-memory cache (5-minute TTL) ────────────────────────────

interface CacheEntry {
  recommendations: Recommendation[]
  audienceId: AudiencePersonaId
  generatedAt: string
  source: 'mock' | 'ai'
  aiEnhanced: boolean
}

const CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ─── Product normalisers ───────────────────────────────────────

function fromShopee(p: {
  itemId: number
  name: string
  image: string
  price: number
  originalPrice?: number
  commissionRate: number
  sales: number
  ratingStar: number
  shopName: string
  category: string
  productLink: string
}): RecommendableProduct {
  return {
    id: `shopee-${p.itemId}`,
    platform: 'shopee' as Platform,
    nativeId: String(p.itemId),
    name: p.name,
    image: p.image,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: Math.round((p.price * p.commissionRate) / 100 * 100) / 100,
    sales: p.sales,
    rating: p.ratingStar,
    shopName: p.shopName,
    category: p.category,
    productLink: p.productLink,
  }
}

function fromTikTok(p: {
  productId: string
  title: string
  imageUrl: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionAmount: number
  sales: number
  rating: number
  shopName: string
  category: string
  productLink: string
  trendScore?: number
}): RecommendableProduct {
  return {
    id: `tiktok-${p.productId}`,
    platform: 'tiktok' as Platform,
    nativeId: p.productId,
    name: p.title,
    image: p.imageUrl,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: p.commissionAmount,
    sales: p.sales,
    rating: p.rating,
    shopName: p.shopName,
    category: p.category,
    productLink: p.productLink,
    trendScore: p.trendScore,
  }
}

function fromLazada(p: {
  itemId: number
  title: string
  imageUrl: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionAmount: number
  sales: number
  rating: number
  shopName: string
  category: string
  productLink: string
}): RecommendableProduct {
  return {
    id: `lazada-${p.itemId}`,
    platform: 'lazada' as Platform,
    nativeId: String(p.itemId),
    name: p.title,
    image: p.imageUrl,
    price: p.price,
    originalPrice: p.originalPrice,
    commissionRate: p.commissionRate,
    commissionAmount: p.commissionAmount,
    sales: p.sales,
    rating: p.rating,
    shopName: p.shopName,
    category: p.category,
    productLink: p.productLink,
  }
}

// ─── Pull unified catalog from all 3 platforms ─────────────────

async function fetchUnifiedCatalog(): Promise<RecommendableProduct[]> {
  const [shopeeRes, tiktokRes, lazadaRes] = await Promise.all([
    shopeeMock.searchProducts('', { limit: 50, sortField: 'sales', sortOrder: 'desc' }),
    tiktokMock.searchProducts('', { limit: 50, sortField: 'sales', sortOrder: 'desc' }),
    lazadaMock.searchProducts('', { limit: 50, sortField: 'sales', sortOrder: 'desc' }),
  ])

  return [
    ...shopeeRes.products.map(fromShopee),
    ...tiktokRes.products.map(fromTikTok),
    ...lazadaRes.products.map(fromLazada),
  ]
}

// ─── AI explanation enhancer ───────────────────────────────────

interface AiExplanationPayload {
  productName: string
  platform: string
  audienceName: string
  audiencePct: number
  commissionPct: number
  commissionRm: number
  trendPct: number
  sales: number
  peakHours: string
}

/**
 * Ask the AI to write a punchy, Manglish-flavoured recommendation summary
 * for each product. Returns a Map<productName, summary>.
 *
 * Returns null if anything goes wrong — caller falls back to algorithmic
 * explanations.
 */
async function enhanceExplanationsWithAI(
  payloads: AiExplanationPayload[],
): Promise<Map<string, string> | null> {
  if (payloads.length === 0) return null

  try {
    const zai = await ZAI.create()

    const systemPrompt = `You are an expert Shopee/TikTok/Lazada affiliate marketing strategist for the Malaysian market.
For each product I give you, write a single punchy sentence (max 25 words) explaining why it's a good pick for that audience.
Use Malaysian Manglish style (mix of English + Bahasa Melayu, e.g. "confirm untung", "best gila", "kena grab").
Reference the audience match %, the trend %, and the commission %. Always mention the commission XTRA % when commission >= 7%.
Output a JSON array of objects with {productName, summary}. No markdown, just JSON.`

    const userPrompt = JSON.stringify(
      payloads.map((p) => ({
        productName: p.productName,
        platform: p.platform,
        audienceName: p.audienceName,
        audienceMatchPct: p.audiencePct,
        commissionPct: p.commissionPct,
        commissionRm: p.commissionRm,
        trendPct: p.trendPct,
        sales: p.sales,
        peakHours: p.peakHours,
      })),
    )

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      productName: string
      summary: string
    }>

    const map = new Map<string, string>()
    for (const item of parsed) {
      if (item.productName && item.summary) {
        map.set(item.productName, item.summary)
      }
    }
    return map
  } catch (err) {
    console.error('[ai/recommend] AI enhancement failed, falling back to algorithmic explanations:', err)
    return null
  }
}

// ─── Main GET handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const audienceId = (searchParams.get('audience') || 'beauty_mama') as AudiencePersonaId
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 12, 1), 50) : 12
    const refresh = searchParams.get('refresh') === '1'

    const audience = getAudienceProfile(audienceId)
    if (!audience) {
      return NextResponse.json(
        { error: `Unknown audience persona: ${audienceId}` },
        { status: 400 },
      )
    }

    // Cache check (unless ?refresh=1)
    const cacheKey = `${audienceId}:${limit}`
    if (!refresh) {
      const cached = CACHE.get(cacheKey)
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_TTL_MS) {
        const response: RecommendationResponse = {
          audience,
          recommendations: cached.recommendations,
          source: cached.source,
          generatedAt: cached.generatedAt,
          algorithmVersion: ALGORITHM_VERSION,
          aiEnhanced: cached.aiEnhanced,
        }
        return NextResponse.json(response)
      }
    }

    // 1. Pull unified catalog from all 3 platforms (in parallel)
    const catalog = await fetchUnifiedCatalog()

    // 2. Score every product with the weighted algorithm
    const scored = catalog.map((p, idx) => calculateRecommendation(p, audience, idx))

    // 3. Rank and pick top N
    const ranked = rankRecommendations(scored)
    const topN = ranked.slice(0, limit)

    // 4. Try to enhance the top-N explanations with AI
    const aiPayloads: AiExplanationPayload[] = topN.map((r) => ({
      productName: r.product.name,
      platform: r.product.platform,
      audienceName: audience.name,
      audiencePct: Math.round(r.score.audience),
      commissionPct: r.product.commissionRate,
      commissionRm: r.product.commissionAmount,
      trendPct: Math.round(
        (typeof r.product.trendScore === 'number' ? r.product.trendScore : r.score.trend) * 0.6,
      ),
      sales: r.product.sales,
      peakHours: audience.peakHours.length
        ? `${audience.peakHours[0]}:00-${audience.peakHours[audience.peakHours.length - 1]}:00`
        : 'anytime',
    }))

    const aiSummaries = await enhanceExplanationsWithAI(aiPayloads)
    let aiEnhanced = false

    if (aiSummaries && aiSummaries.size > 0) {
      // Replace the summary field with AI-generated text where available
      for (const rec of topN) {
        const aiSummary = aiSummaries.get(rec.product.name)
        if (aiSummary) {
          rec.explanation = {
            ...rec.explanation,
            summary: aiSummary,
          }
          aiEnhanced = true
        }
      }
    }

    // 5. Cache the result
    const generatedAt = new Date().toISOString()
    const source: 'mock' | 'ai' = aiEnhanced ? 'ai' : 'mock'
    CACHE.set(cacheKey, {
      recommendations: topN,
      audienceId,
      generatedAt,
      source,
      aiEnhanced,
    })

    const response: RecommendationResponse = {
      audience,
      recommendations: topN,
      source,
      generatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      aiEnhanced,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ai/recommend] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
