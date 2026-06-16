import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// In-memory cache with 30-minute TTL
interface CacheEntry {
  data: unknown
  timestamp: number
}

let keywordsCache: CacheEntry | null = null
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

interface TrendingKeyword {
  id: string
  keyword: string
  searchVolumeEstimate: number
  category: string
  competitionLevel: 'Low' | 'Medium' | 'High'
  seasonalEvent?: string
  trendDirection: 'up' | 'stable' | 'down'
  relatedTerms: string[]
}

const SEASONAL_KEYWORDS: TrendingKeyword[] = [
  // Raya / Hari Raya
  { id: 'sk-1', keyword: 'baju raya 2025', searchVolumeEstimate: 145000, category: 'Fashion', competitionLevel: 'High', seasonalEvent: 'Raya', trendDirection: 'up', relatedTerms: ['baju kurung raya', 'busana raya', 'seluar raya'] },
  { id: 'sk-2', keyword: 'dating raya', searchVolumeEstimate: 98000, category: 'Fashion', competitionLevel: 'High', seasonalEvent: 'Raya', trendDirection: 'up', relatedTerms: ['kasut raya', 'shoes raya'] },
  { id: 'sk-3', keyword: 'hampers raya', searchVolumeEstimate: 72000, category: 'Food & Beverages', competitionLevel: 'Medium', seasonalEvent: 'Raya', trendDirection: 'up', relatedTerms: ['parcel raya', 'bekas raya', 'kuih raya'] },
  { id: 'sk-4', keyword: 'dekorasi raya', searchVolumeEstimate: 55000, category: 'Home & Living', competitionLevel: 'Low', seasonalEvent: 'Raya', trendDirection: 'up', relatedTerms: ['lampu raya', 'ketupat dekorasi'] },
  // 11.11
  { id: 'sk-5', keyword: '11.11 sale shopee', searchVolumeEstimate: 250000, category: 'Electronics', competitionLevel: 'High', seasonalEvent: '11.11', trendDirection: 'up', relatedTerms: ['1111 shopee', '11 nov sale', 'double 11'] },
  { id: 'sk-6', keyword: '11.11 voucher shopee', searchVolumeEstimate: 180000, category: 'Electronics', competitionLevel: 'High', seasonalEvent: '11.11', trendDirection: 'up', relatedTerms: ['kod promo 11.11', 'diskaun 11.11'] },
  // 12.12
  { id: 'sk-7', keyword: '12.12 sale shopee', searchVolumeEstimate: 195000, category: 'Electronics', competitionLevel: 'High', seasonalEvent: '12.12', trendDirection: 'up', relatedTerms: ['1212 shopee', 'year end sale'] },
  // CNY
  { id: 'sk-8', keyword: 'chinese new year decoration', searchVolumeEstimate: 68000, category: 'Home & Living', competitionLevel: 'Medium', seasonalEvent: 'CNY', trendDirection: 'up', relatedTerms: ['deco cny', 'angpow decoration', 'mandarin orange hamper'] },
  { id: 'sk-9', keyword: 'cny dress cheongsam', searchVolumeEstimate: 45000, category: 'Fashion', competitionLevel: 'Medium', seasonalEvent: 'CNY', trendDirection: 'up', relatedTerms: ['qipao', 'cheongsam moden'] },
  // Back to School
  { id: 'sk-10', keyword: 'back to school bag', searchVolumeEstimate: 82000, category: 'Fashion', competitionLevel: 'Medium', seasonalEvent: 'Back to School', trendDirection: 'up', relatedTerms: ['beg sekolah', 'stationery set', 'uniform sekolah'] },
  { id: 'sk-11', keyword: 'stationery bundle sekolah', searchVolumeEstimate: 56000, category: 'Education', competitionLevel: 'Low', seasonalEvent: 'Back to School', trendDirection: 'up', relatedTerms: ['buku nota', 'pensil set'] },
  // 9.9
  { id: 'sk-12', keyword: '9.9 sale shopee', searchVolumeEstimate: 160000, category: 'Electronics', competitionLevel: 'High', seasonalEvent: '9.9', trendDirection: 'up', relatedTerms: ['999 shopee', 'september sale'] },
]

const FALLBACK_KEYWORDS: TrendingKeyword[] = [
  { id: 'kw-1', keyword: 'serum vitamin c', searchVolumeEstimate: 135000, category: 'Beauty', competitionLevel: 'High', trendDirection: 'up', relatedTerms: ['vitamin c serum', 'brightening serum', 'niacinamide'] },
  { id: 'kw-2', keyword: 'wireless earbuds', searchVolumeEstimate: 180000, category: 'Electronics', competitionLevel: 'High', trendDirection: 'stable', relatedTerms: ['tws earbuds', 'bluetooth earphone', 'anc earbuds'] },
  { id: 'kw-3', keyword: 'tudung bawal', searchVolumeEstimate: 150000, category: 'Fashion', competitionLevel: 'High', trendDirection: 'up', relatedTerms: ['bawal instant', 'shawl premium', 'scarf cotton'] },
  { id: 'kw-4', keyword: 'portable blender', searchVolumeEstimate: 110000, category: 'Home & Living', competitionLevel: 'Medium', trendDirection: 'up', relatedTerms: ['juicer portable', 'blender usb', 'smoothie maker'] },
  { id: 'kw-5', keyword: 'kopi susu', searchVolumeEstimate: 95000, category: 'Food & Beverages', competitionLevel: 'Medium', trendDirection: 'up', relatedTerms: ['kopi 3in1', 'kopi tambun', 'white coffee'] },
  { id: 'kw-6', keyword: 'smartwatch', searchVolumeEstimate: 165000, category: 'Electronics', competitionLevel: 'High', trendDirection: 'stable', relatedTerms: ['fitness tracker', 'smart band', 'watch sport'] },
  { id: 'kw-7', keyword: 'kemeja murah', searchVolumeEstimate: 88000, category: 'Fashion', competitionLevel: 'Medium', trendDirection: 'stable', relatedTerms: ['kemeja cotton', 'shirt murah', 'kemeja formal'] },
  { id: 'kw-8', keyword: 'skincare set', searchVolumeEstimate: 120000, category: 'Beauty', competitionLevel: 'High', trendDirection: 'up', relatedTerms: ['skin care routine', 'set skincare', 'moisturizer set'] },
  { id: 'kw-9', keyword: 'gaming mouse', searchVolumeEstimate: 78000, category: 'Electronics', competitionLevel: 'Medium', trendDirection: 'stable', relatedTerms: ['mouse rgb', 'mouse wireless', 'mouse gaming murah'] },
  { id: 'kw-10', keyword: 'car accessories', searchVolumeEstimate: 65000, category: 'Automotive', competitionLevel: 'Low', trendDirection: 'up', relatedTerms: ['kereta aksesori', 'car phone holder', 'car vacuum'] },
  { id: 'kw-11', keyword: 'pet food cat', searchVolumeEstimate: 72000, category: 'Pet', competitionLevel: 'Medium', trendDirection: 'up', relatedTerms: ['makanan kucing', 'cat treats', 'kibble cat'] },
  { id: 'kw-12', keyword: 'keyboard mechanical', searchVolumeEstimate: 58000, category: 'Electronics', competitionLevel: 'Medium', trendDirection: 'up', relatedTerms: ['keyboard rgb', 'keyboard hotswap', 'keycap custom'] },
  { id: 'kw-13', keyword: 'kasut running', searchVolumeEstimate: 92000, category: 'Sports', competitionLevel: 'High', trendDirection: 'stable', relatedTerms: ['running shoes', 'jogging shoes', 'kasut sukan'] },
  { id: 'kw-14', keyword: 'bekas makanan', searchVolumeEstimate: 48000, category: 'Home & Living', competitionLevel: 'Low', trendDirection: 'up', relatedTerms: ['food container', 'lunch box', 'bekas simpanan'] },
  { id: 'kw-15', keyword: 'cushion foundation', searchVolumeEstimate: 105000, category: 'Beauty', competitionLevel: 'High', trendDirection: 'up', relatedTerms: ['cushion matte', 'foundation cushion', 'cushion murah'] },
  ...SEASONAL_KEYWORDS,
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'All'
    const includeSeasonal = searchParams.get('seasonal') !== 'false'
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check cache first
    if (!forceRefresh && keywordsCache && Date.now() - keywordsCache.timestamp < CACHE_TTL) {
      const cached = keywordsCache.data as { keywords: TrendingKeyword[]; source: string }
      let filtered = category === 'All'
        ? cached.keywords
        : cached.keywords.filter((k: TrendingKeyword) => k.category === category)
      if (!includeSeasonal) {
        filtered = filtered.filter((k: TrendingKeyword) => !k.seasonalEvent)
      }
      return NextResponse.json({
        keywords: filtered,
        total: cached.keywords.length,
        source: cached.source,
        fromCache: true,
      })
    }

    let keywords: TrendingKeyword[] = []
    let source = 'ai_analysis'

    try {
      const zai = await ZAI.create()

      // Search for trending keywords on Shopee Malaysia
      const [search1, search2] = await Promise.allSettled([
        zai.functions.invoke('web_search', {
          query: 'trending search terms shopee malaysia 2025 popular keywords',
          num: 10,
        }),
        zai.functions.invoke('web_search', {
          query: 'most searched products shopee malaysia viral keywords',
          num: 10,
        }),
      ])

      const allResults: Array<{ title: string; url: string; snippet: string }> = []
      for (const result of [search1, search2]) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allResults.push(...result.value)
        }
      }

      if (allResults.length > 0) {
        const searchContext = allResults
          .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`)
          .join('\n')

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a Shopee Malaysia SEO and keyword expert. Analyze search data and return a JSON array of trending keywords. Each keyword must have:
- id: string (format "kw-N")
- keyword: string (the search term)
- searchVolumeEstimate: number (estimated monthly search volume)
- category: string (one of: Beauty, Fashion, Electronics, Home & Living, Pet, Food & Beverages, Automotive, Sports, Education)
- competitionLevel: string (exactly one of: "Low", "Medium", "High")
- trendDirection: string (exactly one of: "up", "stable", "down")
- relatedTerms: string[] (2-4 related search terms)

Return exactly 15 diverse keywords. Focus on Malaysian market. Return ONLY the JSON array, no markdown.`,
            },
            {
              role: 'user',
              content: `Based on these search results about trending Shopee Malaysia keywords, identify the top 15 trending search terms:\n\n${searchContext}`,
            },
          ],
          thinking: { type: 'disabled' },
        })

        const content = completion.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          keywords = JSON.parse(jsonMatch[0])
          source = 'ai_analysis'
        }
      }
    } catch (aiError) {
      console.error('AI keywords discovery error:', aiError)
    }

    // Fallback
    if (keywords.length === 0) {
      keywords = FALLBACK_KEYWORDS
      source = 'fallback_data'
    } else {
      // Merge seasonal keywords into AI results
      if (includeSeasonal) {
        const existingIds = new Set(keywords.map((k) => k.id))
        for (const sk of SEASONAL_KEYWORDS) {
          if (!existingIds.has(sk.id)) {
            keywords.push(sk)
          }
        }
      }
    }

    // Cache
    keywordsCache = {
      data: { keywords, source },
      timestamp: Date.now(),
    }

    // Filter
    let filtered = category === 'All'
      ? keywords
      : keywords.filter((k) => k.category === category)
    if (!includeSeasonal) {
      filtered = filtered.filter((k) => !k.seasonalEvent)
    }

    return NextResponse.json({
      keywords: filtered,
      total: keywords.length,
      source,
      fromCache: false,
    })
  } catch (error) {
    console.error('Keywords trend error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending keywords' },
      { status: 500 }
    )
  }
}
