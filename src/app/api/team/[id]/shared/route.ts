import { NextRequest, NextResponse } from 'next/server'
import {
  getTeamById,
  getResourcesByTeam,
  addSharedResource,
} from '@/lib/team/mock-data'
import type { TeamSharedResponse, AddSharedResourceRequest } from '@/lib/team/types'

/**
 * GET /api/team/[id]/shared
 *
 * List all shared resources (affiliate links + content) for a team.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<TeamSharedResponse | { error: string; source: string }>> {
  try {
    const { id } = await params
    const team = getTeamById(id)

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'mock' },
        { status: 404 },
      )
    }

    const resources = getResourcesByTeam(id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return NextResponse.json(
      { resources, total: resources.length, source: 'mock' as const },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[/api/team/[id]/shared GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch shared resources',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/team/[id]/shared
 *
 * Add a new shared resource (affiliate link or content) to the team library.
 */
export async function POST(
  request: NextRequest,
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

    const body = (await request.json()) as AddSharedResourceRequest

    if (!body.type || !['affiliate_link', 'content'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid resource type', source: 'mock' },
        { status: 400 },
      )
    }

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters', source: 'mock' },
        { status: 400 },
      )
    }

    const resource = addSharedResource(id, {
      type: body.type,
      title: body.title.trim(),
      description: body.description,
      product: body.product,
      platform: body.platform,
      affiliateUrl: body.affiliateUrl,
      contentType: body.contentType,
      niche: body.niche,
      tags: body.tags,
      ownerName: 'You',
    })

    if (!resource) {
      return NextResponse.json(
        { error: 'Failed to add shared resource', source: 'mock' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { resource, source: 'mock' },
      { status: 201 },
    )
  } catch (error) {
    console.error('[/api/team/[id]/shared POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add shared resource',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}
