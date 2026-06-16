import { NextRequest, NextResponse } from 'next/server'

import {
  ALL_PERMISSIONS,
  type ApiKeyPermission,
  type ApiKeyResponse,
  type RateLimitTier,
  type UpdateApiKeyRequest,
} from '@/lib/apikeys/types'
import { findKey } from '@/lib/apikeys/store'

/** Allowed rate-limit tiers. */
const VALID_TIERS: RateLimitTier[] = [100, 1000, 10000]

/** ─── GET /api/apikeys/[id] ───────────────────────────────────────────
 *
 * Returns full detail for one key, including a per-day usage slice from the
 * mock timeseries. The plaintext secret is NEVER included.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const key = findKey(id)
    if (!key) {
      return NextResponse.json(
        { error: `API key "${id}" not found.`, source: 'mock' as const },
        { status: 404 },
      )
    }

    const body: ApiKeyResponse = { key, source: 'mock' }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/apikeys/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch API key.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

/** ─── PATCH /api/apikeys/[id] ─────────────────────────────────────────
 *
 * Body: UpdateApiKeyRequest (all fields optional)
 *
 * Updates the key's name and/or permissions and/or rate limit. Does NOT
 * regenerate the secret.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const key = findKey(id)
    if (!key) {
      return NextResponse.json(
        { error: `API key "${id}" not found.`, source: 'mock' as const },
        { status: 404 },
      )
    }
    if (key.status === 'revoked') {
      return NextResponse.json(
        { error: 'Cannot edit a revoked key. Generate a new one instead.', source: 'mock' as const },
        { status: 409 },
      )
    }

    let body: UpdateApiKeyRequest
    try {
      body = (await request.json()) as UpdateApiKeyRequest
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body. Expected Partial<{ name, permissions, rateLimit }>.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // ── Apply name ────────────────────────────────────────────────────
    if (typeof body.name === 'string') {
      const trimmed = body.name.trim()
      if (trimmed.length < 2 || trimmed.length > 60) {
        return NextResponse.json(
          { error: 'Field "name" must be 2-60 characters.', source: 'mock' as const },
          { status: 400 },
        )
      }
      key.name = trimmed
    }

    // ── Apply permissions ─────────────────────────────────────────────
    if (Array.isArray(body.permissions)) {
      if (body.permissions.length === 0) {
        return NextResponse.json(
          { error: 'permissions must be a non-empty array.', source: 'mock' as const },
          { status: 400 },
        )
      }
      const cleaned = Array.from(
        new Set(
          body.permissions.filter(
            (p): p is ApiKeyPermission => ALL_PERMISSIONS.includes(p as ApiKeyPermission),
          ),
        ),
      )
      if (cleaned.length === 0) {
        return NextResponse.json(
          { error: 'No valid permissions supplied.', source: 'mock' as const },
          { status: 400 },
        )
      }
      key.permissions = cleaned
    }

    // ── Apply rate limit ──────────────────────────────────────────────
    if (typeof body.rateLimit === 'number') {
      if (!VALID_TIERS.includes(body.rateLimit)) {
        return NextResponse.json(
          {
            error: `rateLimit must be one of: ${VALID_TIERS.join(', ')}.`,
            source: 'mock' as const,
          },
          { status: 400 },
        )
      }
      key.rateLimit = body.rateLimit
    }

    const response: ApiKeyResponse = { key, source: 'mock' }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[PATCH /api/apikeys/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update API key.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

/** ─── DELETE /api/apikeys/[id] ────────────────────────────────────────
 *
 * Revokes the key (soft delete). Subsequent authenticated requests using
 * the revoked key's plaintext will return 401.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const key = findKey(id)
    if (!key) {
      return NextResponse.json(
        { error: `API key "${id}" not found.`, source: 'mock' as const },
        { status: 404 },
      )
    }

    key.status = 'revoked'
    const response: ApiKeyResponse = { key, source: 'mock' }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[DELETE /api/apikeys/[id]] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to revoke API key.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
