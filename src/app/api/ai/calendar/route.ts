import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'
import { parseJsonBody } from '@/lib/api-error'
import {
  type CalendarEntry,
  type CalendarPlatform,
  type CalendarPreferences,
  type CalendarNiche,
  type CalendarTone,
  type ContentCalendar,
  type DayOfWeek,
  type GenerateCalendarRequest,
  type GenerateCalendarResponse,
  type TimeSlot,
  TIME_SLOTS,
  DAYS_OF_WEEK,
  NICHE_LABELS,
  TONE_LABELS,
  PLATFORM_LABELS,
} from '@/lib/calendar/types'
import {
  SEASONAL_EVENTS,
  activeEventsForDate,
  upcomingEvents,
  nextEvent,
} from '@/lib/calendar/seasonal-events'
import { MOCK_GENERATED_CALENDAR, MOCK_PAST_CALENDARS } from '@/lib/calendar/mock-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextMonday(now: Date = new Date()): Date {
  const d = new Date(now)
  const day = d.getDay() // 0=Sun ... 6=Sat
  const diffToMonday = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseWeekStart(input?: string): Date {
  if (!input) return getNextMonday()
  const d = new Date(input + 'T00:00:00+08:00')
  if (isNaN(d.getTime())) return getNextMonday()
  return d
}

function isoDate(d: Date): string {
  // Format as YYYY-MM-DD using local time
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `Week of ${monday.getDate()} ${months[monday.getMonth()]} — ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`
}

function formatTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`
}

/**
 * Pick the days and time slots to fill based on the desired posts-per-day.
 * Higher-weight slots (peak, evening) are preferred; weekends get slightly more.
 */
function pickSlotsForWeek(postsPerDay: number): Array<{ day: DayOfWeek; slot: typeof TIME_SLOTS[number] }> {
  const result: Array<{ day: DayOfWeek; slot: typeof TIME_SLOTS[number] }> = []
  // Sort slots by weight descending (peak first)
  const sortedSlots = [...TIME_SLOTS].sort((a, b) => b.weight - a.weight)

  for (const day of DAYS_OF_WEEK) {
    // Weekend: bump up by 1 post if postsPerDay is moderate
    const isWeekend = day === 'Sat' || day === 'Sun'
    const target = isWeekend ? Math.min(postsPerDay + 1, 5) : postsPerDay

    // Pick the top `target` slots, but skip night for low-frequency weeks
    const daySlots = sortedSlots.slice(0, target)
    for (const slot of daySlots) {
      result.push({ day, slot })
    }
  }
  return result
}

/**
 * Distribute platforms across slots — rotate through requested platforms,
 * with TikTok favoured for peak hours (highest virality).
 */
function assignPlatform(
  slots: Array<{ day: DayOfWeek; slot: typeof TIME_SLOTS[number] }>,
  requestedPlatforms: CalendarPlatform[],
): Array<{ day: DayOfWeek; slot: typeof TIME_SLOTS[number]; platform: CalendarPlatform }> {
  if (requestedPlatforms.length === 0) requestedPlatforms = ['shopee', 'tiktok']
  let idx = 0
  return slots.map(({ day, slot }) => {
    // Peak → prefer TikTok if available
    let platform: CalendarPlatform
    if (slot.id === 'peak' && requestedPlatforms.includes('tiktok')) {
      platform = 'tiktok'
    } else if (slot.id === 'lunch' && requestedPlatforms.includes('shopee')) {
      platform = 'shopee'
    } else {
      platform = requestedPlatforms[idx % requestedPlatforms.length]
      idx++
    }
    return { day, slot, platform }
  })
}

// ─── Algorithmic Fallback (used when AI fails) ────────────────────────────────

const FALLBACK_PRODUCTS: Record<CalendarNiche, string[]> = {
  beauty: [
    'Garnier Vitamin C Serum',
    'Somethinc Niacinamide Serum',
    'Cetaphil Gentle Cleanser',
    'Wardah Exclusive Matte Lipstick',
    'Innisfree Green Tea Toner',
    'Laneige Water Sleeping Mask',
    'COSRX AHA/BHA Clarifying Toner',
  ],
  tech: [
    'Xiaomi Redmi Buds 5',
    'Anker PowerCore 10000',
    'Logitech MX Master 3S',
    'Realme Note 50',
    'Roborock Q7 Max+ Robot Vacuum',
    'USB-C 65W GaN Charger',
    'Samsung T7 Portable SSD 1TB',
  ],
  fashion: [
    'Baju Kurung Modern Set',
    'Levis 501 Original Jeans',
    'Nike Revolution 7 Running Shoes',
    'Uniqlo AIRism T-Shirt',
    'Charles & Keith Mini Bag',
    'Cotton Tudung Bawal',
    'Adidas Samba OG',
  ],
  home: [
    'Philips Air Fryer 4.1L',
    'Dyson V8 Vacuum',
    'Tefal Rice Cooker 1.8L',
    'Xiaomi Smart Air Purifier 4 Lite',
    'IKEA Storage Boxes (set of 3)',
    'Dekko Memory Foam Pillow',
    'Philips Wake-Up Light Alarm',
  ],
  food: [
    'Milo 3-in-1 Sachets (30 pack)',
    'Mamee Monster Snack Pack',
    'Ayam Brand Sardines Canned',
    'Old Town White Coffee 3-in-1',
    'Hup Seng Cream Crackers',
    'Maggi Curry Flavour Noodles (5 pack)',
    'Lingham Sriracha Hot Sauce',
  ],
  mixed: [
    'Garnier Vitamin C Serum',
    'Xiaomi Redmi Buds 5',
    'Philips Air Fryer 4.1L',
    'Baju Kurung Modern Set',
    'Anker PowerCore 10000',
    'Milo 3-in-1 Sachets (30 pack)',
    'Tefal Rice Cooker 1.8L',
  ],
}

const FALLBACK_BRIEFS: Record<TimeSlot, string[]> = {
  morning: [
    'Morning routine starter — quick demo of how this fits into your AM ritual.',
    'Wake-up-and-shop pick — share why this is the perfect first purchase of the day.',
    'Coffee & content combo — short 30s demo to start the day.',
  ],
  lunch: [
    'Lunch break deals — quick unboxing + price check in under 60s.',
    'Midday steal alert — show the price drop vs retail and where to grab it.',
    'Lunch-and-learn — demo a key feature while eating.',
  ],
  evening: [
    'Post-work browse pick — set up a demo that solves a common evening problem.',
    'Wind-down review — honest take on whether this is worth the splurge.',
    'Evening haul share — show this in context with 2 other recent finds.',
  ],
  peak: [
    'Prime-time showcase — full demo with hook in first 3s. Push the affiliate link in caption.',
    'Golden-hour review — show before/after or side-by-side comparison for max impact.',
    'Peak-hour deal alert — create urgency with limited-stock framing.',
  ],
  night: [
    'Late-night self-care angle — show how this fits into a calm bedtime routine.',
    'Night-owl deals roundup — quick mention of this product in a 5-picks list.',
    'Bedtime unboxing — soft, relaxing ASMR-style reveal.',
  ],
}

function makeFallbackEntries(
  weekStart: Date,
  preferences: CalendarPreferences,
  seasonalEventIds: string[],
): CalendarEntry[] {
  const slots = assignPlatform(pickSlotsForWeek(preferences.postsPerDay), preferences.platforms)
  const productPool = FALLBACK_PRODUCTS[preferences.niche] ?? FALLBACK_PRODUCTS.mixed
  const usedProducts = new Set<string>()

  return slots.map((s, i) => {
    // Pick a product that hasn't been used this week (or recycle if exhausted)
    let product = productPool[i % productPool.length]
    if (usedProducts.has(product) && usedProducts.size < productPool.length) {
      for (const p of productPool) {
        if (!usedProducts.has(p)) { product = p; break }
      }
    }
    usedProducts.add(product)

    const briefPool = FALLBACK_BRIEFS[s.slot.id]
    const brief = briefPool[i % briefPool.length]

    // Hashtags: niche + seasonal + disclosure
    const nicheTag = `#${NICHE_LABELS[preferences.niche].toLowerCase()}`
    const platformTag = `#${s.platform}finds`
    const baseTags = [nicheTag, platformTag, '#Malaysia', '#ad']

    const seasonalEv = seasonalEventIds
      .map((id) => SEASONAL_EVENTS.find((e) => e.id === id))
      .find(Boolean)
    if (seasonalEv) {
      baseTags.push(seasonalEv.hashtags[0], seasonalEv.hashtags[1])
    }

    // Predicted score
    const baseEngagement = 60 + (s.slot.weight * 20)
    const baseConversion = 55 + (s.slot.weight * 18)
    const baseVirality = s.platform === 'tiktok' ? 75 : 60
    const seasonalBoost = seasonalEv ? 20 + (seasonalEv.commissionMultiplier - 1) * 40 : 40
    const engagement = Math.min(99, Math.round(baseEngagement + Math.random() * 10))
    const conversion = Math.min(99, Math.round(baseConversion + Math.random() * 8))
    const virality = Math.min(99, Math.round(baseVirality + Math.random() * 10))
    const seasonal = Math.min(99, Math.round(seasonalBoost + Math.random() * 5))
    const overall = Math.round(engagement * 0.3 + conversion * 0.35 + virality * 0.25 + seasonal * 0.1)

    const dayIndex = DAYS_OF_WEEK.indexOf(s.day)
    const entryDate = new Date(weekStart)
    entryDate.setDate(weekStart.getDate() + dayIndex)
    const id = `entry-${s.day.toLowerCase()}-${s.slot.id}-${i}`

    return {
      id,
      day: s.day,
      timeSlot: s.slot.id,
      hour: s.slot.hour,
      minute: s.slot.minute,
      timeLabel: formatTimeLabel(s.slot.hour, s.slot.minute),
      platform: s.platform,
      product,
      contentBrief: brief,
      hashtags: baseTags,
      predictedScore: { engagement, conversion, virality, seasonal, overall },
      seasonalEventId: seasonalEv?.id,
    }
  })
}

// ─── AI Prompt Builder ────────────────────────────────────────────────────────

function buildAiPrompt(
  weekStart: Date,
  preferences: CalendarPreferences,
  seasonalEventIds: string[],
  slotPlan: Array<{ day: DayOfWeek; slot: typeof TIME_SLOTS[number]; platform: CalendarPlatform }>,
): string {
  const seasonalContext = seasonalEventIds
    .map((id) => {
      const ev = SEASONAL_EVENTS.find((e) => e.id === id)
      if (!ev) return ''
      return `${ev.emoji} ${ev.name} — themes: ${ev.contentThemes.slice(0, 3).join(', ')}; hashtags: ${ev.hashtags.slice(0, 3).join(' ')}; commission x${ev.commissionMultiplier}`
    })
    .filter(Boolean)
    .join('\n') || 'No major seasonal events active this week.'

  const slotList = slotPlan
    .map((s, i) => `${i + 1}. ${s.day} ${formatTimeLabel(s.slot.hour, s.slot.minute)} (${s.slot.id}) → ${PLATFORM_LABELS[s.platform]}`)
    .join('\n')

  const featuredList = preferences.featuredProducts?.length
    ? `Featured products the user wants highlighted: ${preferences.featuredProducts.join(', ')}`
    : 'No specific products requested — pick suitable Malaysian-market items.'

  return `You are a professional Malaysian affiliate content strategist.
Generate a weekly content calendar for the week starting Monday ${isoDate(weekStart)} (Malaysian time, MYT/UTC+8).

Niche: ${NICHE_LABELS[preferences.niche]}
Tone: ${TONE_LABELS[preferences.tone]}
Posts per day: ${preferences.postsPerDay}
Platforms: ${preferences.platforms.map((p) => PLATFORM_LABELS[p]).join(', ')}

Seasonal context (consider boosting entries that align):
${seasonalContext}

${featuredList}

You must produce EXACTLY ${slotPlan.length} entries matching this day/time/platform plan:
${slotList}

For EACH entry, return a JSON object with these fields:
- day (Mon/Tue/Wed/Thu/Fri/Sat/Sun)
- timeSlot (morning/lunch/evening/peak/night)
- platform ("shopee" | "tiktok" | "lazada")
- product (string — Malaysian-market product name, mix of popular + niche)
- contentBrief (string — 1-2 sentence angle/hook for the post, written for a Malaysian audience. Use natural Manglish when tone is casual.)
- hashtags (string[] — 4-6 hashtags mixing niche + seasonal + platform + #ad or #promosi)
- predictedEngagement (0-99)
- predictedConversion (0-99)
- predictedVirality (0-99)

Return a JSON object with shape: { "entries": [ ... ] }
Do NOT include any text outside the JSON. Do NOT wrap in markdown code fences.`
}

interface AiEntryDto {
  day?: string
  timeSlot?: string
  platform?: string
  product?: string
  contentBrief?: string
  hashtags?: string[]
  predictedEngagement?: number
  predictedConversion?: number
  predictedVirality?: number
}

function coerceAiEntries(
  raw: unknown,
  slotPlan: Array<{ day: DayOfWeek; slot: typeof TIME_SLOTS[number]; platform: CalendarPlatform }>,
  weekStart: Date,
  preferences: CalendarPreferences,
  seasonalEventIds: string[],
): CalendarEntry[] {
  const fallbackEntries = makeFallbackEntries(weekStart, preferences, seasonalEventIds)
  if (!raw || typeof raw !== 'object') return fallbackEntries

  const list = (raw as { entries?: AiEntryDto[] }).entries
  if (!Array.isArray(list) || list.length === 0) return fallbackEntries

  const result: CalendarEntry[] = []
  for (let i = 0; i < slotPlan.length; i++) {
    const plan = slotPlan[i]
    const ai = list[i] || list[i % list.length]
    const fallback = fallbackEntries[i]

    const day = (typeof ai?.day === 'string' && DAYS_OF_WEEK.includes(ai.day as DayOfWeek))
      ? (ai.day as DayOfWeek) : plan.day
    const slotId = (typeof ai?.timeSlot === 'string' && TIME_SLOTS.some((t) => t.id === ai.timeSlot))
      ? (ai.timeSlot as TimeSlot) : plan.slot.id
    const slot = TIME_SLOTS.find((t) => t.id === slotId)!
    const platform = (typeof ai?.platform === 'string' && ['shopee', 'tiktok', 'lazada'].includes(ai.platform))
      ? (ai.platform as CalendarPlatform) : plan.platform

    const product = (typeof ai?.product === 'string' && ai.product.trim())
      ? ai.product.trim().slice(0, 200)
      : fallback.product
    const contentBrief = (typeof ai?.contentBrief === 'string' && ai.contentBrief.trim())
      ? ai.contentBrief.trim().slice(0, 600)
      : fallback.contentBrief
    const hashtags = Array.isArray(ai?.hashtags)
      ? ai!.hashtags!.filter((h): h is string => typeof h === 'string' && h.trim().length > 0).slice(0, 8)
      : fallback.hashtags

    const engagement = clampScore(ai?.predictedEngagement ?? fallback.predictedScore.engagement)
    const conversion = clampScore(ai?.predictedConversion ?? fallback.predictedScore.conversion)
    const virality = clampScore(ai?.predictedVirality ?? fallback.predictedScore.virality)
    const seasonal = fallback.predictedScore.seasonal
    const overall = Math.round(engagement * 0.3 + conversion * 0.35 + virality * 0.25 + seasonal * 0.1)

    const dayIndex = DAYS_OF_WEEK.indexOf(day)
    const entryDate = new Date(weekStart)
    entryDate.setDate(weekStart.getDate() + dayIndex)

    result.push({
      id: `entry-${day.toLowerCase()}-${slot.id}-${i}`,
      day,
      timeSlot: slot.id,
      hour: slot.hour,
      minute: slot.minute,
      timeLabel: formatTimeLabel(slot.hour, slot.minute),
      platform,
      product,
      contentBrief,
      hashtags,
      predictedScore: { engagement, conversion, virality, seasonal, overall },
      seasonalEventId: fallback.seasonalEventId,
    })
  }

  return result
}

function clampScore(n: unknown): number {
  const num = typeof n === 'number' ? n : 70
  return Math.max(0, Math.min(99, Math.round(num)))
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.ai)) {
      return enforceRateLimit(request, RATE_LIMITS.ai)!
    }

    const body = await parseJsonBody<GenerateCalendarRequest>(request)
    if (!body.preferences || !body.niche || !Array.isArray(body.platforms)) {
      throw ApiError.badRequest('Missing required fields: niche, platforms, preferences')
    }

    const preferences: CalendarPreferences = {
      niche: body.niche,
      platforms: body.platforms,
      postsPerDay: Math.max(1, Math.min(5, body.preferences.postsPerDay ?? 2)),
      tone: body.preferences.tone || 'casual',
      seasonalBoost: body.preferences.seasonalBoost ?? true,
      featuredProducts: body.preferences.featuredProducts || [],
    }

    const weekStart = parseWeekStart(body.weekStartDate)
    const weekStartIso = isoDate(weekStart)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekEndIso = isoDate(weekEnd)
    const label = weekLabel(weekStart)

    // Seasonal events: active during the week + upcoming (for the banner)
    const weekMid = new Date(weekStart)
    weekMid.setDate(weekStart.getDate() + 3)
    const activeEvents = preferences.seasonalBoost
      ? activeEventsForDate(weekMid)
      : []
    const upcoming = upcomingEvents(weekStart, 7)
    const allEventsForWeek = Array.from(new Map(
      [...activeEvents, ...upcoming].map((e) => [e.id, e]),
    ).values())
    const seasonalEventIds = allEventsForWeek.map((e) => e.id)

    // Build the slot plan
    const slots = assignPlatform(pickSlotsForWeek(preferences.postsPerDay), preferences.platforms)

    // Try AI first
    let entries: CalendarEntry[]
    let source: 'ai' | 'mock' = 'ai'

    try {
      const zai = await ZAI.create()
      const prompt = buildAiPrompt(weekStart, preferences, seasonalEventIds, slots)

      const completion = await zai.chat.completions.create({
        model: 'default',
        messages: [
          {
            role: 'system',
            content: `You are an expert Malaysian affiliate marketing content strategist.
You speak Manglish naturally and know Malaysian marketplaces (Shopee, TikTok Shop, Lazada) intimately.
Always respond with strict JSON — no markdown, no commentary.`,
          },
          { role: 'user', content: prompt },
        ],
      })

      const raw = completion.choices?.[0]?.message?.content || ''
      // Extract JSON (handle both raw and code-fenced responses)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      entries = coerceAiEntries(parsed, slots, weekStart, preferences, seasonalEventIds)
      if (entries.length === 0) {
        entries = makeFallbackEntries(weekStart, preferences, seasonalEventIds)
        source = 'mock'
      }
    } catch (aiError) {
      console.error('[AI Calendar] AI generation failed, using fallback:', aiError)
      entries = makeFallbackEntries(weekStart, preferences, seasonalEventIds)
      source = 'mock'
    }

    const calendar: ContentCalendar = {
      id: `cal-${weekStartIso}-${Date.now()}`,
      weekStartDate: weekStartIso,
      weekEndDate: weekEndIso,
      label,
      entries,
      seasonalEvents: allEventsForWeek,
      preferences,
      source,
      generatedAt: new Date().toISOString(),
    }

    const response: GenerateCalendarResponse = { calendar, source }
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return handleError(error)
  }
}

// ─── GET Handler ──────────────────────────────────────────────────────────────
// Returns the most recent mock calendars (history) + a default generated example.

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }

    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') // ISO date of Monday

    // If a specific week is requested, return the generated example with that week's dates
    if (week) {
      const weekStart = parseWeekStart(week)
      const weekStartIso = isoDate(weekStart)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekEndIso = isoDate(weekEnd)
      const label = weekLabel(weekStart)

      // Look in past calendars first
      const match = MOCK_PAST_CALENDARS.find((c) => c.weekStartDate === weekStartIso)
      if (match) {
        return NextResponse.json({ calendar: match, source: match.source })
      }

      // Otherwise return the generated example with shifted dates
      const calendar: ContentCalendar = {
        ...MOCK_GENERATED_CALENDAR,
        id: `cal-${weekStartIso}`,
        weekStartDate: weekStartIso,
        weekEndDate: weekEndIso,
        label,
        generatedAt: new Date().toISOString(),
      }
      return NextResponse.json({ calendar, source: calendar.source })
    }

    // Default: return history + next-upcoming-event info
    const now = new Date()
    const next = nextEvent(now)
    return NextResponse.json({
      pastCalendars: MOCK_PAST_CALENDARS,
      nextEvent: next,
      source: 'mock',
    })
  } catch (error) {
    return handleError(error)
  }
}
