import { NextRequest, NextResponse } from 'next/server'

import {
  ALL_PERMISSIONS,
  type ApiKey,
  type ApiKeyPermission,
  type ApiKeysListResponse,
  type GenerateApiKeyRequest,
  type NewApiKey,
  type NewApiKeyResponse,
  type RateLimitTier,
} from '@/lib/apikeys/types'
import { maskKey, keyPrefix } from '@/lib/apikeys/mock-data'
import { keyStore, plaintextRegistry } from '@/lib/apikeys/store'

/** Allowed rate-limit tiers. */
const VALID_TIERS: RateLimitTier[] = [100, 1000, 10000]

/** Generate 16 random hex chars using Web Crypto (Node 18+). */
function randomHex(n: number): string {
  const bytes = new Uint8Array(n)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, n)
}

/** Pick an env prefix based on the requested rate limit. */
function envFromTier(tier: RateLimitTier): string {
  if (tier >= 10000) return 'prod'
  if (tier >= 1000) return 'ana'
  return 'test'
}

/** Compose a full plaintext key. */
function composePlaintext(env: string, body: string): string {
  return `tvf_${env}_${body}${randomHex(16)}`
}

/** ─── GET /api/apikeys ────────────────────────────────────────────────
 *
 * Returns all API keys for the authenticated user (masked). Never exposes
 * the plaintext secret.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const body: ApiKeysListResponse = {
      keys: keyStore,
      source: 'mock',
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/apikeys] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to list API keys.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

/** ─── POST /api/apikeys ───────────────────────────────────────────────
 *
 * Body: GenerateApiKeyRequest
 *
 * Mints a new API key. The plaintext secret is included in the response
 * body exactly once; subsequent GETs only return the masked preview.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: GenerateApiKeyRequest
    try {
      body = (await request.json()) as GenerateApiKeyRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { name, permissions[], rateLimit[, expiresInDays] }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // ── Validate name ────────────────────────────────────────────────
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Field "name" must be at least 2 characters.', source: 'mock' as const },
        { status: 400 },
      )
    }
    if (body.name.trim().length > 60) {
      return NextResponse.json(
        { error: 'Field "name" must be 60 characters or fewer.', source: 'mock' as const },
        { status: 400 },
      )
    }

    // ── Validate permissions ─────────────────────────────────────────
    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Field "permissions" must be a non-empty array.', source: 'mock' as const },
        { status: 400 },
      )
    }
    const permissions = Array.from(
      new Set(
        body.permissions.filter(
          (p): p is ApiKeyPermission => ALL_PERMISSIONS.includes(p as ApiKeyPermission),
        ),
      ),
    )
    if (permissions.length === 0) {
      return NextResponse.json(
        { error: 'No valid permissions supplied.', source: 'mock' as const },
        { status: 400 },
      )
    }

    // ── Validate rate limit ──────────────────────────────────────────
    if (!VALID_TIERS.includes(body.rateLimit)) {
      return NextResponse.json(
        {
          error: `Field "rateLimit" must be one of: ${VALID_TIERS.join(', ')}.`,
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // ── Validate optional expiry ─────────────────────────────────────
    let expiresAt: string | null = null
    if (typeof body.expiresInDays === 'number') {
      if (body.expiresInDays < 1 || body.expiresInDays > 3650) {
        return NextResponse.json(
          { error: 'expiresInDays must be between 1 and 3650.', source: 'mock' as const },
          { status: 400 },
        )
      }
      const d = new Date()
      d.setDate(d.getDate() + body.expiresInDays)
      expiresAt = d.toISOString()
    }

    // ── Mint the key ─────────────────────────────────────────────────
    const env = envFromTier(body.rateLimit)
    const body8 = randomHex(10)
    const plaintext = composePlaintext(env, body8)
    const id = `key-${Date.now().toString(36)}${randomHex(4)}`

    const apiKey: ApiKey = {
      id,
      name: body.name.trim(),
      maskedKey: maskKey(plaintext),
      prefix: keyPrefix(plaintext),
      permissions,
      rateLimit: body.rateLimit,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt,
    }

    keyStore.unshift(apiKey)
    plaintextRegistry[id] = plaintext

    const newKey: NewApiKey = { ...apiKey, plaintextKey: plaintext }
    const response: NewApiKeyResponse = { key: newKey, source: 'mock' }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[POST /api/apikeys] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to mint API key.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
