import { NextRequest, NextResponse } from 'next/server'
import {
  getTeamById,
  getMembersByTeam,
  getInvitationsByTeam,
  computeTeamStats,
  updateTeam,
  deleteTeam,
} from '@/lib/team/mock-data'
import type { TeamDetailResponse } from '@/lib/team/types'

/**
 * GET /api/team/[id]
 *
 * Return a single team with its members, pending invitations, and aggregated stats.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<TeamDetailResponse | { error: string; source: string }>> {
  try {
    const { id } = await params
    const team = getTeamById(id)

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'mock' },
        { status: 404 },
      )
    }

    const members = getMembersByTeam(id)
    const invitations = getInvitationsByTeam(id)
    const stats = computeTeamStats(id)

    return NextResponse.json(
      { team, members, invitations, stats, source: 'mock' as const },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[/api/team/[id] GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/team/[id]
 *
 * Update team name, description, default role, or niches.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    const team = getTeamById(id)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'mock' },
        { status: 404 },
      )
    }

    const updated = updateTeam(id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      defaultRole: body.defaultRole,
      niches: Array.isArray(body.niches) ? body.niches : undefined,
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update team', source: 'mock' },
        { status: 500 },
      )
    }

    return NextResponse.json({ team: updated, source: 'mock' }, { status: 200 })
  } catch (error) {
    console.error('[/api/team/[id] PATCH] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/team/[id]
 *
 * Permanently delete a team. Only the owner may perform this action.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const team = getTeamById(id)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'mock' },
        { status: 404 },
      )
    }

    const ok = deleteTeam(id)
    if (!ok) {
      return NextResponse.json(
        { error: 'Failed to delete team', source: 'mock' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: true, source: 'mock' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[/api/team/[id] DELETE] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}
