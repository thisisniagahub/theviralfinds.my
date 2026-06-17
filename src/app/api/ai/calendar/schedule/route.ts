import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError, parseJsonBody } from '@/lib/api-error'
import {
  type CalendarEntry,
  type ContentCalendar,
  type DayOfWeek,
  type ScheduleCalendarItemResult,
  type ScheduleCalendarRequest,
  type ScheduleCalendarResponse,
  type TimeSlot,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  PLATFORM_LABELS,
} from '@/lib/calendar/types'
import { MOCK_PAST_CALENDARS, MOCK_GENERATED_CALENDAR } from '@/lib/calendar/mock-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDate(iso: string): Date {
  // Treat as MYT (UTC+8) start of day
  return new Date(iso + 'T00:00:00+08:00')
}

function resolveEntryDateTime(weekStartIso: string, entry: CalendarEntry): Date {
  const weekStart = isoToDate(weekStartIso)
  const dayIndex = DAYS_OF_WEEK.indexOf(entry.day)
  const d = new Date(weekStart)
  d.setDate(weekStart.getDate() + dayIndex)
  d.setHours(entry.hour, entry.minute, 0, 0)
  return d
}

function buildCaption(entry: CalendarEntry, calendar: ContentCalendar): string {
  const tags = entry.hashtags && entry.hashtags.length > 0
    ? entry.hashtags.join(' ')
    : '#ad'
  const platformLabel = PLATFORM_LABELS[entry.platform]
  const seasonalNote = entry.seasonalEventId
    ? `\n\n📅 Themed for ${calendar.seasonalEvents.find((e) => e.id === entry.seasonalEventId)?.name ?? 'seasonal event'}`
    : ''
  return `${entry.product} — ${entry.contentBrief}\n\n🛒 Platform: ${platformLabel}\n\n${tags}${seasonalNote}`
}

/** Find an entry by ID across the in-memory mock calendars. */
function findEntries(calendarId: string, entryIds: string[]): CalendarEntry[] {
  // Try past calendars first, then the generated example
  const allCalendars: ContentCalendar[] = [...MOCK_PAST_CALENDARS, MOCK_GENERATED_CALENDAR]
  const cal = allCalendars.find((c) => c.id === calendarId)
  if (!cal) return []
  if (entryIds.length === 0) return cal.entries
  return cal.entries.filter((e) => entryIds.includes(e.id))
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }

    const body = await parseJsonBody<ScheduleCalendarRequest>(request)
    if (!body.calendarId || !body.weekStartDate) {
      throw ApiError.badRequest('Missing required fields: calendarId, weekStartDate')
    }

    const requestedIds = Array.isArray(body.entryIds) ? body.entryIds : []
    const entries = findEntries(body.calendarId, requestedIds)

    if (entries.length === 0) {
      throw ApiError.notFound(
        `No entries found for calendarId=${body.calendarId}` +
        (requestedIds.length ? ` with entryIds=${requestedIds.join(',')}` : ''),
      )
    }

    // Look up the source calendar for context (for caption building)
    const allCalendars: ContentCalendar[] = [...MOCK_PAST_CALENDARS, MOCK_GENERATED_CALENDAR]
    const sourceCalendar = allCalendars.find((c) => c.id === body.calendarId) ?? {
      ...MOCK_GENERATED_CALENDAR,
      id: body.calendarId,
      weekStartDate: body.weekStartDate,
    }

    const results: ScheduleCalendarItemResult[] = []
    let scheduled = 0
    let failed = 0

    for (const entry of entries) {
      try {
        const scheduledAt = resolveEntryDateTime(body.weekStartDate, entry)
        // Skip past dates — push to next week instead
        const now = new Date()
        let finalDate = scheduledAt
        if (scheduledAt.getTime() < now.getTime()) {
          finalDate = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
        }

        const caption = buildCaption(entry, sourceCalendar)
        const platforms = [entry.platform]
        const post = await db.scheduledPost.create({
          data: {
            caption,
            platforms: JSON.stringify(platforms),
            productUrl: null,
            affiliateLink: null,
            imageUrl: null,
            hashtags: JSON.stringify(entry.hashtags),
            status: 'scheduled',
            scheduledAt: finalDate,
          },
        })

        results.push({
          entryId: entry.id,
          scheduledPostId: post.id,
          scheduledAt: finalDate.toISOString(),
          platform: entry.platform,
          success: true,
        })
        scheduled++
      } catch (err) {
        results.push({
          entryId: entry.id,
          scheduledPostId: null,
          scheduledAt: resolveEntryDateTime(body.weekStartDate, entry).toISOString(),
          platform: entry.platform,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown scheduling error',
        })
        failed++
      }
    }

    const response: ScheduleCalendarResponse = {
      calendarId: body.calendarId,
      scheduled,
      failed,
      results,
      source: 'mock',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
