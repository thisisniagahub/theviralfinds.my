import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { calculatePredictedScore, extractHashtags } from '@/lib/abtesting/scorer'
import { generateTemplateVariants, newTestId, newVariantId, abTestingStore } from '@/lib/abtesting/mock-data'
import { VARIANT_STYLE_META } from '@/lib/abtesting/types'
import type {
  AbNiche,
  AbPlatform,
  AbTone,
  ContentVariant,
  GenerateResponse,
  VariantStyle,
} from '@/lib/abtesting/types'

// ─── Request validation ────────────────────────────────────────────────────

const PLATFORMS: AbPlatform[] = ['shopee', 'tiktok', 'lazada']
const NICHES: AbNiche[] = ['Beauty', 'Tech', 'Fashion', 'Home', 'Food']
const TONES: AbTone[] = ['Casual', 'Professional', 'Hype', 'Educational']

const generateSchema = z.object({
  product: z.string().min(1, 'Product name is required').max(300),
  platform: z.enum(PLATFORMS as [AbPlatform, ...AbPlatform[]]),
  niche: z.enum(NICHES as [AbNiche, ...AbNiche[]]),
  tone: z.enum(TONES as [AbTone, ...AbTone[]]).optional(),
})

// ─── Per-style system prompts ──────────────────────────────────────────────

const PLATFORM_LABEL: Record<AbPlatform, string> = {
  shopee: 'Shopee Malaysia',
  tiktok: 'TikTok Malaysia',
  lazada: 'Lazada Malaysia',
}

const TONE_INSTRUCTION: Record<AbTone, string> = {
  Casual: 'Casual, friendly, relatable — like talking to a friend.',
  Professional: 'Polished, informative, still approachable. Use clear benefits.',
  Hype: 'High-energy, enthusiastic, lots of excitement! Use power words!',
  Educational: 'Helpful, informative, teach the audience something useful.',
}

const STYLE_BRIEF: Record<VariantStyle, string> = {
  direct: `Style: DIRECT & PUNCHY (Variant A).
- Short, punchy, scroll-stopping.
- Lead with a power word or emoji.
- Hard-hitting benefits in 1-2 sentences.
- Immediate, explicit CTA ("Click link bio sekarang").
- Aim for 120-180 characters total.`,
  story: `Style: STORY-DRIVEN (Variant B).
- Open with "Story time" or a relatable narrative.
- Show a personal journey / before-after.
- Soft, trust-building CTA at the end.
- Use Malaysian cultural references.
- Aim for 180-260 characters total.`,
  urgency: `Style: URGENCY-FOCUSED (Variant C).
- Open with a scarcity / time-limited hook (LAST 24 HOURS, FLASH SALE, etc.).
- Highlight price drop or limited stock.
- Strong FOMO CTA ("Jangan lepaskan!", "Link bio NOW").
- Include ⏰ or ⚠️ emoji.
- Aim for 150-220 characters total.`,
}

const COMMON_RULES = `Write in Manglish (mix English + Bahasa Malaysia naturally).
Use Malaysian slang like "gila", "shiok", "walao", "cedebest", "terer", "confirm", "tipu kalau tak".
Include 4-6 hashtags mixing: platform tag, niche tag, trending tag, and #ad disclosure.
Return ONLY the post content + hashtags on a single message. No meta-commentary, no quotation marks, no labels.`

/**
 * Build a ZAI chat prompt for one variant style.
 */
function buildMessages(
  style: VariantStyle,
  product: string,
  platform: AbPlatform,
  niche: AbNiche,
  tone?: AbTone
) {
  const toneLine = tone ? `Tone: ${TONE_INSTRUCTION[tone]}` : `Tone: ${TONE_INSTRUCTION.Casual}`
  const system = `You are a Malaysian affiliate content creator for ${PLATFORM_LABEL[platform]}.
${STYLE_BRIEF[style]}

${toneLine}

Niche: ${niche}
Product: ${product}

${COMMON_RULES}`

  return [
    { role: 'system' as const, content: system },
    {
      role: 'user' as const,
      content: `Generate ONE ${VARIANT_STYLE_META[style].name} caption for "${product}" on ${PLATFORM_LABEL[platform]}.`,
    },
  ]
}

/**
 * Call ZAI to generate a single variant's content. Throws on failure.
 */
async function generateOneVariantWithAI(
  style: VariantStyle,
  product: string,
  platform: AbPlatform,
  niche: AbNiche,
  tone?: AbTone
): Promise<string> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    model: 'default',
    messages: buildMessages(style, product, platform, niche, tone),
  })
  const content = completion.choices?.[0]?.message?.content?.trim() || ''
  if (!content) throw new Error(`AI returned empty content for variant ${style}`)
  // Strip wrapping quotes if the model added them
  return content.replace(/^["'\s]+|["'\s]+$/g, '')
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }

    const { product, platform, niche, tone } = await generateSchema.parseAsync(await request.json())

    const testId = newTestId()
    const createdAt = new Date().toISOString()
    const styles: VariantStyle[] = ['direct', 'story', 'urgency']

    // Attempt AI generation for all 3 variants in parallel.
    // Each variant falls back to template independently on failure.
    const results = await Promise.allSettled(
      styles.map((style) => generateOneVariantWithAI(style, product, platform, niche, tone))
    )

    const templateVariants = generateTemplateVariants(product, platform, niche, tone)

    const variants: ContentVariant[] = styles.map((style, i) => {
      const meta = VARIANT_STYLE_META[style]
      const result = results[i]
      const tmpl = templateVariants[i]
      const id = newVariantId()

      if (result.status === 'fulfilled') {
        const content = result.value
        const hashtags = extractHashtags(content)
        const { predictedScore, breakdown } = calculatePredictedScore(content, hashtags)
        return {
          id,
          testId,
          label: meta.label,
          style,
          styleName: meta.name,
          content,
          hashtags,
          predictedScore,
          scoreBreakdown: breakdown,
          isWinner: false,
          actual: null,
          source: 'ai' as const,
          createdAt,
        }
      }
      // Fallback to template variant
      return {
        id,
        testId,
        label: tmpl.label,
        style: tmpl.style,
        styleName: tmpl.styleName,
        content: tmpl.content,
        hashtags: tmpl.hashtags,
        predictedScore: tmpl.predictedScore,
        scoreBreakdown: tmpl.scoreBreakdown,
        isWinner: false,
        actual: null,
        source: 'mock' as const,
        createdAt,
      }
    })

    // If any variant fell back to mock, mark the whole test as 'mock'
    const allAi = variants.every((v) => v.source === 'ai')
    const testSource: 'ai' | 'mock' = allAi ? 'ai' : 'mock'

    // Persist to in-memory store so /track can find it later
    const test = {
      id: testId,
      product,
      platform,
      niche,
      tone: tone ?? null,
      variants,
      winnerVariantId: null,
      createdAt,
      source: testSource,
    }
    abTestingStore.tests.set(testId, test)

    const response: GenerateResponse = {
      testId,
      product,
      platform,
      niche,
      tone: tone ?? null,
      variants,
      source: testSource,
      createdAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return handleError(error)
  }
}

// ─── GET handler (convenience: latest test) ────────────────────────────────

export async function GET() {
  try {
    const tests = Array.from(abTestingStore.tests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    if (tests.length === 0) throw ApiError.notFound('No A/B tests found')
    const latest = tests[0]
    return NextResponse.json(latest)
  } catch (error) {
    return handleError(error)
  }
}
