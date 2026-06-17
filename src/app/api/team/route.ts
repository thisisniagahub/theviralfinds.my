import { NextRequest, NextResponse } from 'next/server'
import {
  TEAMS,
  createTeam,
} from '@/lib/team/mock-data'
import type { TeamListResponse, CreateTeamRequest } from '@/lib/team/types'

/**
 * GET /api/team
 *
 * List all teams the current user belongs to. In this mock implementation
 * the demo user is a member of every team.
 */
export async function GET(_request: NextRequest): Promise<NextResponse<TeamListResponse>> {
  try {
    const teams = TEAMS.slice().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return NextResponse.json(
      { teams, total: teams.length, source: 'mock' as const },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[/api/team GET] Error:', error)
    return NextResponse.json(
      {
        teams: [],
        total: 0,
        source: 'mock' as const,
        error: 'Failed to fetch teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/team
 *
 * Create a new team. The current user becomes the owner.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateTeamRequest

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Team name must be at least 3 characters',
          source: 'mock',
        },
        { status: 400 },
      )
    }

    const team = createTeam({
      name: body.name.trim(),
      description: body.description,
      niches: body.niches,
      ownerName: 'You',
    })

    return NextResponse.json(
      { team, source: 'mock' as const },
      { status: 201 },
    )
  } catch (error) {
    console.error('[/api/team POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create team',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}
