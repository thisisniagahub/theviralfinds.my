import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// In-memory cache with 30-minute TTL
interface CacheEntry {
  data: unknown
  timestamp: number
}

let competitorCache: CacheEntry | null = null
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

interface CompetitorProfile {
  id: string
  name: string
  niche: string
  platforms: string[]
  estimatedFollowers: string
  contentStrategy: string
  strengths: string[]
  tipsForYou: string
}

interface CompetitorTip {
  id: string
  category: string
  tip: string
  source: string
}

const FALLBACK_COMPETITORS: CompetitorProfile[] = [
  {
    id: 'comp-1',
    name: 'KakakTech',
    niche: 'Tech & Gadgets Reviews',
    platforms: ['TikTok', 'Instagram', 'YouTube'],
    estimatedFollowers: '450K+',
    contentStrategy: 'Unboxing and honest review format. Posts 2-3 times daily on TikTok with trending audio. Uses "real talk" approach - shows both pros and cons. Affiliate links in bio and pinned comments.',
    strengths: ['Authentic reviews build trust', 'Consistent daily posting', 'Multi-platform presence', 'Strong TikTok engagement'],
    tipsForYou: 'Focus on authenticity. Malaysian audiences value honest opinions over polished ads. Show real usage scenarios and compare products at different price points.',
  },
  {
    id: 'comp-2',
    name: 'BeautyByAina',
    niche: 'Beauty & Skincare',
    platforms: ['TikTok', 'Instagram'],
    estimatedFollowers: '320K+',
    contentStrategy: 'Before/after transformation content. Creates "skincare routine under RM50" series. Leverages Raya and festive seasons for themed content. Stories feature daily product picks with swipe-up links.',
    strengths: ['Seasonal content timing', 'Budget-friendly positioning', 'High engagement on tutorials', 'Strong Raya/CNY campaigns'],
    tipsForYou: 'Create budget-focused content series. Malaysian beauty buyers love "under RM50" and "worth it or not" formats. Time your content around sale events and festive seasons.',
  },
  {
    id: 'comp-3',
    name: 'AbangKitchen',
    niche: 'Kitchen & Home Appliances',
    platforms: ['TikTok', 'YouTube', 'Facebook'],
    estimatedFollowers: '280K+',
    contentStrategy: 'Recipe + product combo content. Shows cooking tutorial featuring the product naturally. Facebook for longer reviews, TikTok for quick recipe clips. Groups products by price tier (belakang RM30 vs premium).',
    strengths: ['Product-in-context approach', 'Multi-format content', 'Price tier categorization', 'Community building on Facebook'],
    tipsForYou: 'Show products in real use. Kitchen items sell best when people see them being used for local recipes. Create comparison content between budget and premium options.',
  },
  {
    id: 'comp-4',
    name: 'FashionNabila',
    niche: 'Modest Fashion & Tudung',
    platforms: ['Instagram', 'TikTok'],
    estimatedFollowers: '520K+',
    contentStrategy: 'OOTD posts with shopee finds. "Shopee Find of the Week" series. Styling videos showing 5 ways to wear one item. Collaborates with tudung brands for exclusive discount codes.',
    strengths: ['Styling versatility content', 'Brand collaborations', 'Exclusive discount codes', 'Strong Instagram aesthetic'],
    tipsForYou: 'Create "multiple ways to style" content. Modest fashion buyers want versatility. Partner with brands for exclusive codes - it increases conversion rates significantly.',
  },
  {
    id: 'comp-5',
    name: 'GamerBoyMY',
    niche: 'Gaming Peripherals & Setup',
    platforms: ['YouTube', 'TikTok', 'Discord'],
    estimatedFollowers: '190K+',
    contentStrategy: 'Desk setup tours and "budget vs premium" comparison videos. Livestreams product testing on YouTube. Discord community for exclusive deals. Creates "setup under RM500" content series.',
    strengths: ['Community-first approach', 'Comparison content format', 'Livestream engagement', 'Budget setup niche'],
    tipsForYou: 'Build a community around your niche. Gaming audiences trust peer recommendations. Create comparison and "build your setup under RM X" content that helps buyers decide.',
  },
  {
    id: 'comp-6',
    name: 'MommyLinda',
    niche: 'Baby & Kids Products',
    platforms: ['Facebook', 'TikTok', 'Instagram'],
    estimatedFollowers: '350K+',
    contentStrategy: 'Mom hack content featuring baby products. "What I bought vs what I actually use" reviews. Facebook groups for mommy community. Seasonal content for back-to-school and baby fair periods.',
    strengths: ['Relatable mom content', 'Facebook community building', 'Seasonal campaign timing', 'Honest product comparison'],
    tipsForYou: 'Be relatable and honest. Mom communities value real experiences over ads. Create "expectation vs reality" content and build Facebook groups for long-term engagement.',
  },
]

const FALLBACK_TIPS: CompetitorTip[] = [
  { id: 'tip-1', category: 'Content', tip: 'Post consistently during peak hours (8-10 PM MYT) when Malaysian audiences are most active on Shopee and social media.', source: 'Top Affiliate Strategy' },
  { id: 'tip-2', category: 'Conversion', tip: 'Use "under RM50" and "budget find" in your titles - price-sensitive keywords drive 3x more clicks in the Malaysian market.', source: 'Conversion Analysis' },
  { id: 'tip-3', category: 'Seasonal', tip: 'Start creating Raya content 6-8 weeks before. Fashion and home categories peak 4-6 weeks before Hari Raya.', source: 'Seasonal Planning' },
  { id: 'tip-4', category: 'Platform', tip: 'TikTok + Shopee combination generates highest ROI for Malaysian affiliates. Short-form video with link-in-bio is the winning formula.', source: 'Platform Analytics' },
  { id: 'tip-5', category: 'Trust', tip: 'Show both pros and cons of products. Malaysian buyers trust honest reviews 4x more than purely positive ones.', source: 'Consumer Trust Study' },
  { id: 'tip-6', category: 'Format', tip: '"Is it worth it?" and "Expectation vs Reality" formats get 2.5x more saves and shares on TikTok Malaysia.', source: 'Content Format Research' },
  { id: 'tip-7', category: 'Timing', tip: 'For 11.11 and 12.12 campaigns, start teasing deals 2 weeks before. Early bird content captures the planning audience.', source: 'Sale Event Strategy' },
  { id: 'tip-8', category: 'Community', tip: 'Build a Telegram or WhatsApp broadcast list. Direct notifications about deals convert at 15-20% vs 2-3% from social posts.', source: 'Community Building' },
]

export async function GET() {
  try {
    // Check cache first
    if (competitorCache && Date.now() - competitorCache.timestamp < CACHE_TTL) {
      const cached = competitorCache.data as { competitors: CompetitorProfile[]; tips: CompetitorTip[]; source: string }
      return NextResponse.json({
        ...cached,
        fromCache: true,
      })
    }

    let competitors: CompetitorProfile[] = []
    let tips: CompetitorTip[] = []
    let source = 'ai_analysis'

    try {
      const zai = await ZAI.create()

      // Search for top Shopee affiliates in Malaysia
      const [search1, search2] = await Promise.allSettled([
        zai.functions.invoke('web_search', {
          query: 'top shopee affiliate malaysia 2025 successful creator',
          num: 10,
        }),
        zai.functions.invoke('web_search', {
          query: 'shopee affiliate tips strategies malaysia influencer',
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
              content: `You are a Shopee affiliate marketing analyst. Analyze competitor data and return a JSON object with two fields:

1. "competitors": Array of 6 competitor profiles. Each must have:
- id: string (format "comp-N")
- name: string (creative Malaysian affiliate name)
- niche: string (their specialty area)
- platforms: string[] (social platforms they use, e.g. ["TikTok", "Instagram"])
- estimatedFollowers: string (e.g. "320K+")
- contentStrategy: string (2-3 sentences describing their approach)
- strengths: string[] (3-4 key strengths)
- tipsForYou: string (1-2 sentence actionable tip based on their success)

2. "tips": Array of 8 strategy tips. Each must have:
- id: string (format "tip-N")
- category: string (one of: Content, Conversion, Seasonal, Platform, Trust, Format, Timing, Community)
- tip: string (actionable advice)
- source: string (where this insight comes from)

Focus on Malaysian market context. Return ONLY the JSON object, no markdown.`,
            },
            {
              role: 'user',
              content: `Based on these search results about top Shopee affiliates and strategies in Malaysia, analyze the competitive landscape:\n\n${searchContext}`,
            },
          ],
          thinking: { type: 'disabled' },
        })

        const content = completion.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          competitors = parsed.competitors || []
          tips = parsed.tips || []
          source = 'ai_analysis'
        }
      }
    } catch (aiError) {
      console.error('AI competitor analysis error:', aiError)
    }

    // Fallback
    if (competitors.length === 0) {
      competitors = FALLBACK_COMPETITORS
      tips = FALLBACK_TIPS
      source = 'fallback_data'
    }

    // Cache
    competitorCache = {
      data: { competitors, tips, source },
      timestamp: Date.now(),
    }

    return NextResponse.json({
      competitors,
      tips,
      source,
      fromCache: false,
    })
  } catch (error) {
    console.error('Competitor analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    )
  }
}
