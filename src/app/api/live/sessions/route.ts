import { NextResponse } from 'next/server'
import { MOCK_SESSIONS, getMockSummary } from '@/lib/live/mock-data'
import type { CreateLiveSessionInput, LiveSession } from '@/lib/live/types'

// In-memory store — seeded from mock data. Persists for the lifetime of the
// Node.js process. (Real persistence will be wired up by the main agent via
// a ShopeeLiveSession Prisma model in Wave 2 integration.)
let sessions: LiveSession[] = [...MOCK_SESSIONS]

// ─── GET /api/live/sessions — list sessions ────────────────────────────────
// Optional query: ?status=scheduled|live|completed|cancelled
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const summary = searchParams.get('summary') === 'true'

    if (summary) {
      return NextResponse.json({
        sessions: sessions.map(stripForList),
        summary: getMockSummary(),
      })
    }

    const filtered = status ? sessions.filter((s) => s.status === status) : sessions
    return NextResponse.json({
      sessions: filtered.map(stripForList),
      count: filtered.length,
    })
  } catch (error) {
    console.error('GET /api/live/sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live sessions' },
      { status: 500 }
    )
  }
}

// ─── POST /api/live/sessions — create a new session ────────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateLiveSessionInput>

    if (!body.title || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'title and scheduledAt are required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newSession: LiveSession = {
      id: `session_${Date.now()}`,
      title: body.title,
      description: body.description ?? '',
      scheduledAt: body.scheduledAt,
      durationMin: body.durationMin ?? 60,
      status: 'scheduled',
      hostName: body.hostName ?? 'Kak Amy',
      products: [],
      tags: body.tags ?? [],
      createdAt: now,
      updatedAt: now,
      scripts: [],
      averageCommission: 0,
      potentialEarnings: 0,
    }

    sessions = [newSession, ...sessions]

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    console.error('POST /api/live/sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to create live session' },
      { status: 500 }
    )
  }
}

// Strip scripts + reduce products to ids when returning list (smaller payload)
function stripForList(s: LiveSession) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    scheduledAt: s.scheduledAt,
    durationMin: s.durationMin,
    status: s.status,
    hostName: s.hostName,
    products: s.products ?? [],
    productCount: (s.products ?? []).length,
    tags: s.tags ?? [],
    averageCommission: s.averageCommission,
    potentialEarnings: s.potentialEarnings,
    actualEarnings: s.actualEarnings,
    viewerCount: s.viewerCount,
    peakViewerCount: s.peakViewerCount,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
  }
}

// Expose internal store for the [id] route (server-side singleton module)
export function _getSessionsStore() {
  return sessions
}
export function _setSessionsStore(next: LiveSession[]) {
  sessions = next
}
