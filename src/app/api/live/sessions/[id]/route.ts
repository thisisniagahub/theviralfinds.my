import { NextResponse } from 'next/server'
import {
  _getSessionsStore,
  _setSessionsStore,
} from '@/app/api/live/sessions/route'
import type { LiveSession, UpdateLiveSessionInput } from '@/lib/live/types'

// ─── GET /api/live/sessions/[id] — full session detail ──────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = _getSessionsStore().find((s) => s.id === id)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ session })
  } catch (error) {
    console.error('GET /api/live/sessions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/live/sessions/[id] — update a session ───────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<UpdateLiveSessionInput>

    const store = _getSessionsStore()
    const idx = store.findIndex((s) => s.id === id)
    if (idx === -1) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const existing = store[idx]
    const updated: LiveSession = {
      ...existing,
      ...body,
      // Never overwrite server-controlled fields from client payload:
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }

    // If status changed to 'live', stamp startedAt
    if (body.status === 'live' && !existing.startedAt) {
      updated.startedAt = new Date().toISOString()
    }
    // If status changed to 'completed', stamp endedAt
    if (body.status === 'completed' && !existing.endedAt) {
      updated.endedAt = new Date().toISOString()
    }

    const next = [...store]
    next[idx] = updated
    _setSessionsStore(next)

    return NextResponse.json({ session: updated })
  } catch (error) {
    console.error('PATCH /api/live/sessions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/live/sessions/[id] — cancel a session ──────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const store = _getSessionsStore()
    const idx = store.findIndex((s) => s.id === id)
    if (idx === -1) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Soft-delete: mark as cancelled (preserves history for analytics)
    const next = [...store]
    const cancelled: LiveSession = {
      ...next[idx],
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    }
    next[idx] = cancelled
    _setSessionsStore(next)

    return NextResponse.json({ ok: true, session: cancelled })
  } catch (error) {
    console.error('DELETE /api/live/sessions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel session' },
      { status: 500 }
    )
  }
}
