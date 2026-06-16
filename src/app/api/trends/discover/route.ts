import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// In-memory cache with 30-minute TTL
interface CacheEntry {
  data: unknown
  timestamp: number
}

let discoverCache: CacheEntry | null = null
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

interface TrendingProduct {
  id: string
  name: string
  category: string
  estimatedCommissionRate: number
  trendIndicator: '🔥 Rising' | '⭐ Hot' | '📈 Growing'
  whyTrending: string
  priceRange: string
  searchVolume: string
}

const FALLBACK_PRODUCTS: TrendingProduct[] = [
  {
    id: 'tp-1',
    name: 'Serum Vitamin C Brightening',
    category: 'Beauty',
    estimatedCommissionRate: 8.5,
    trendIndicator: '⭐ Hot',
    whyTrending: 'K-beauty trend continues to dominate Malaysian market. Vitamin C serums are the #1 skincare search term on Shopee MY with increasing demand for affordable options.',
    priceRange: 'RM 15 - RM 65',
    searchVolume: '85K+',
  },
  {
    id: 'tp-2',
    name: 'Wireless Earbuds TWS Pro',
    category: 'Electronics',
    estimatedCommissionRate: 5.2,
    trendIndicator: '🔥 Rising',
    whyTrending: 'Budget TWS earbuds under RM50 are viral on TikTok. Multiple local brands competing with features like ANC and 40hr battery life at low prices.',
    priceRange: 'RM 25 - RM 199',
    searchVolume: '120K+',
  },
  {
    id: 'tp-3',
    name: 'Baju Kurung Moden Raya',
    category: 'Fashion',
    estimatedCommissionRate: 7.0,
    trendIndicator: '📈 Growing',
    whyTrending: 'Raya season approaching - modern kurung sets are in high demand. Pastel colors and minimalist designs trending for 2025.',
    priceRange: 'RM 45 - RM 189',
    searchVolume: '95K+',
  },
  {
    id: 'tp-4',
    name: 'Pet Automatic Feeder Smart',
    category: 'Pet',
    estimatedCommissionRate: 6.5,
    trendIndicator: '🔥 Rising',
    whyTrending: 'Pet ownership surge post-pandemic continues. Smart feeders with WiFi camera features are the new must-have for Malaysian pet owners.',
    priceRange: 'RM 55 - RM 250',
    searchVolume: '45K+',
  },
  {
    id: 'tp-5',
    name: 'Portable Blender USB Rechargeable',
    category: 'Home & Living',
    estimatedCommissionRate: 9.0,
    trendIndicator: '⭐ Hot',
    whyTrending: 'Health-conscious Malaysians blending smoothies on-the-go. TikTok viral content driving massive sales for sub-RM50 models.',
    priceRange: 'RM 20 - RM 80',
    searchVolume: '110K+',
  },
  {
    id: 'tp-6',
    name: 'RGB Gaming Keyboard Mechanical',
    category: 'Electronics',
    estimatedCommissionRate: 4.8,
    trendIndicator: '📈 Growing',
    whyTrending: 'Esports growth in Malaysia driving gaming peripheral sales. Hot-swappable switches and custom keycaps are trending features.',
    priceRange: 'RM 49 - RM 350',
    searchVolume: '75K+',
  },
  {
    id: 'tp-7',
    name: 'Tudung Bawal Premium Cotton',
    category: 'Fashion',
    estimatedCommissionRate: 7.5,
    trendIndicator: '⭐ Hot',
    whyTrending: 'Modest fashion market booming. Premium cotton bawal with instant designs are the top choice for working professionals.',
    priceRange: 'RM 25 - RM 95',
    searchVolume: '90K+',
  },
  {
    id: 'tp-8',
    name: 'Air Purifier HEPA Filter Home',
    category: 'Home & Living',
    estimatedCommissionRate: 5.5,
    trendIndicator: '📈 Growing',
    whyTrending: 'Haze season awareness boosting air purifier demand. Compact models for bedrooms under RM150 are the sweet spot.',
    priceRange: 'RM 69 - RM 450',
    searchVolume: '55K+',
  },
  {
    id: 'tp-9',
    name: 'Kopi Susu Tambun 3-in-1',
    category: 'Food & Beverages',
    estimatedCommissionRate: 10.0,
    trendIndicator: '🔥 Rising',
    whyTrending: 'Local coffee brands going viral on social media. Kedai kopi culture at home - instant premium coffee is a huge market.',
    priceRange: 'RM 12 - RM 45',
    searchVolume: '130K+',
  },
  {
    id: 'tp-10',
    name: 'Smart Watch Fitness Tracker',
    category: 'Electronics',
    estimatedCommissionRate: 5.0,
    trendIndicator: '⭐ Hot',
    whyTrending: 'Health monitoring features (SpO2, ECG) now available at RM50-RM150 price point. Massive demand from health-conscious consumers.',
    priceRange: 'RM 39 - RM 299',
    searchVolume: '140K+',
  },
  {
    id: 'tp-11',
    name: 'Car Phone Holder Magnetic',
    category: 'Automotive',
    estimatedCommissionRate: 8.0,
    trendIndicator: '📈 Growing',
    whyTrending: 'Navigation essential for Grab drivers and daily commuters. Magnetic holders with fast-charging feature are the top pick.',
    priceRange: 'RM 15 - RM 65',
    searchVolume: '65K+',
  },
  {
    id: 'tp-12',
    name: 'Cushion Foundation Matte',
    category: 'Beauty',
    estimatedCommissionRate: 9.5,
    trendIndicator: '🔥 Rising',
    whyTrending: 'Malaysian hot & humid weather makes cushion foundation the go-to. Local brands like Safi and Silkygirl gaining market share with halal certification.',
    priceRange: 'RM 20 - RM 75',
    searchVolume: '100K+',
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'All'
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check cache first
    if (!forceRefresh && discoverCache && Date.now() - discoverCache.timestamp < CACHE_TTL) {
      const cached = discoverCache.data as { products: TrendingProduct[]; source: string; cachedAt: string }
      // Filter by category if needed
      const filtered = category === 'All'
        ? cached.products
        : cached.products.filter((p: TrendingProduct) => p.category === category)
      return NextResponse.json({
        ...cached,
        products: filtered,
        fromCache: true,
      })
    }

    let products: TrendingProduct[] = []
    let source = 'ai_analysis'

    try {
      const zai = await ZAI.create()

      // Search for trending products on Shopee Malaysia
      const [search1, search2, search3] = await Promise.allSettled([
        zai.functions.invoke('web_search', {
          query: 'trending products shopee malaysia 2025',
          num: 10,
        }),
        zai.functions.invoke('web_search', {
          query: 'viral shopee products malaysia',
          num: 10,
        }),
        zai.functions.invoke('web_search', {
          query: 'best selling shopee malaysia 2025',
          num: 10,
        }),
      ])

      const allResults: Array<{ title: string; url: string; snippet: string }> = []
      for (const result of [search1, search2, search3]) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allResults.push(...result.value)
        }
      }

      if (allResults.length > 0) {
        // Use AI to analyze and structure the data
        const searchContext = allResults
          .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`)
          .join('\n')

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a Shopee Malaysia affiliate marketing expert. Analyze trending product data and return a JSON array of trending products. Each product must have these exact fields:
- id: string (format "tp-N")
- name: string (product name, keep it concise)
- category: string (one of: Beauty, Fashion, Electronics, Home & Living, Pet, Food & Beverages, Automotive, Sports)
- estimatedCommissionRate: number (1-15, typical Shopee affiliate rates)
- trendIndicator: string (exactly one of: "🔥 Rising", "⭐ Hot", "📈 Growing")
- whyTrending: string (1-2 sentence explanation of why it's trending in Malaysia)
- priceRange: string (in RM, e.g. "RM 25 - RM 80")
- searchVolume: string (estimated monthly search volume, e.g. "85K+")

Return exactly 12 diverse products across different categories. Focus on Malaysian market context. Return ONLY the JSON array, no markdown.`,
            },
            {
              role: 'user',
              content: `Based on these search results about trending Shopee Malaysia products, identify the top 12 trending products:\n\n${searchContext}`,
            },
          ],
          thinking: { type: 'disabled' },
        })

        const content = completion.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          products = JSON.parse(jsonMatch[0])
          source = 'ai_analysis'
        }
      }
    } catch (aiError) {
      console.error('AI trend discovery error:', aiError)
    }

    // Fallback to static data
    if (products.length === 0) {
      products = FALLBACK_PRODUCTS
      source = 'fallback_data'
    }

    // Cache the results
    discoverCache = {
      data: { products, source, cachedAt: new Date().toISOString() },
      timestamp: Date.now(),
    }

    // Filter by category
    const filtered = category === 'All'
      ? products
      : products.filter((p) => p.category === category)

    return NextResponse.json({
      products: filtered,
      total: products.length,
      source,
      cachedAt: new Date().toISOString(),
      fromCache: false,
    })
  } catch (error) {
    console.error('Trend discover error:', error)
    return NextResponse.json(
      { error: 'Failed to discover trends' },
      { status: 500 }
    )
  }
}
