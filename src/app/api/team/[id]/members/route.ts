import { NextRequest, NextResponse } from 'next/server'
import {
  getTeamById,
  getMembersByTeam,
  inviteMember,
  removeMember,
  updateMemberRole,
} from '@/lib/team/mock-data'
import type { TeamRole, InviteMemberRequest, UpdateRoleRequest } from '@/lib/team/types'

const VALID_ROLES: TeamRole[] = ['owner', 'admin', 'member', 'viewer']

/**
 * GET /api/team/[id]/members
 *
 * List all members of a team.
 */
export async function GET(
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

    const members = getMembersByTeam(id).sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
    )

    return NextResponse.json(
      { members, total: members.length, source: 'mock' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[/api/team/[id]/members GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch members',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/team/[id]/members
 *
 * Invite a new member by email. The invitation is created with a 14-day
 * expiry. Only owner/admin may invite.
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

    const body = (await request.json()) as InviteMemberRequest

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address', source: 'mock' },
        { status: 400 },
      )
    }

    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role', source: 'mock' },
        { status: 400 },
      )
    }

    // Cannot invite as owner
    if (body.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot invite as owner', source: 'mock' },
        { status: 400 },
      )
    }

    // Check member limit
    const currentMembers = getMembersByTeam(id)
    if (currentMembers.length >= team.memberLimit) {
      return NextResponse.json(
        {
          error: `Team is at member limit (${team.memberLimit}). Upgrade your plan to invite more members.`,
          source: 'mock',
        },
        { status: 403 },
      )
    }

    const invitation = inviteMember(id, {
      email: body.email,
      role: body.role,
      message: body.message,
      invitedBy: 'You',
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Failed to create invitation', source: 'mock' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { invitation, source: 'mock' },
      { status: 201 },
    )
  } catch (error) {
    console.error('[/api/team/[id]/members POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to invite member',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/team/[id]/members
 *
 * Update a member's role. Owner's role cannot be changed.
 */
export async function PATCH(
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

    const body = (await request.json()) as UpdateRoleRequest

    if (!body.memberId) {
      return NextResponse.json(
        { error: 'memberId is required', source: 'mock' },
        { status: 400 },
      )
    }

    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role', source: 'mock' },
        { status: 400 },
      )
    }

    if (body.role === 'owner') {
      return NextResponse.json(
        { error: 'Ownership transfer is not supported via this endpoint', source: 'mock' },
        { status: 400 },
      )
    }

    const member = updateMemberRole(id, body.memberId, body.role)
    if (!member) {
      return NextResponse.json(
        {
          error: 'Member not found or cannot change owner role',
          source: 'mock',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({ member, source: 'mock' }, { status: 200 })
  } catch (error) {
    console.error('[/api/team/[id]/members PATCH] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update member role',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/team/[id]/members
 *
 * Remove a member from the team. The owner cannot be removed.
 * Pass ?memberId=xxx to specify which member to remove.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId query parameter is required', source: 'mock' },
        { status: 400 },
      )
    }

    const team = getTeamById(id)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', source: 'mock' },
        { status: 404 },
      )
    }

    const ok = removeMember(id, memberId)
    if (!ok) {
      return NextResponse.json(
        {
          error: 'Cannot remove member — either not found or member is the owner',
          source: 'mock',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: true, source: 'mock' },
      { status: 200 },
    )
  } catch (error) {
    console.error('[/api/team/[id]/members DELETE] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove member',
        message: error instanceof Error ? error.message : 'Unknown error',
        source: 'mock',
      },
      { status: 500 },
    )
  }
}
