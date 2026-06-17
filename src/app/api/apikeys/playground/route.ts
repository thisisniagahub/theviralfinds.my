import { NextRequest, NextResponse } from 'next/server'

import type {
  HttpMethod,
  PlaygroundRequest,
  PlaygroundResponse,
} from '@/lib/apikeys/types'
import { API_ENDPOINTS, matchEndpoint } from '@/lib/apikeys/endpoints'
import { findKey } from '@/lib/apikeys/store'

/**
 * POST /api/apikeys/playground
 *
 * Body: PlaygroundRequest { method, endpoint, params, body, keyId }
 *
 * Mock "send request" handler for the interactive playground tab.
 * Resolves the endpoint doc by matching method+path, then returns the
 * canned responseExample with a synthetic latency. Designed to feel like
 * hitting the real `/api/v1/*` surface without touching the network.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: PlaygroundRequest
    try {
      body = (await request.json()) as PlaygroundRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { method, endpoint, params[], body?, keyId? }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!body.method || !body.endpoint) {
      return NextResponse.json(
        { error: 'Fields "method" and "endpoint" are required.', source: 'mock' as const },
        { status: 400 },
      )
    }

    const method = body.method as HttpMethod
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `method must be one of: ${validMethods.join(', ')}.`, source: 'mock' as const },
        { status: 400 },
      )
    }

    // Resolve path params from the playground's key-value pairs and substitute
    // them into the path so :id-style params get echoed back.
    let resolvedPath = body.endpoint.trim()
    const pathParams = body.params.filter((p) => p.key && p.value !== '')
    for (const pp of pathParams) {
      resolvedPath = resolvedPath.replace(`:${pp.key}`, encodeURIComponent(pp.value))
    }
    // Strip leading/trailing whitespace again after substitution.
    resolvedPath = resolvedPath.trim()

    const matched = matchEndpoint(method, resolvedPath)

    // ── Key resolution (for response headers only) ─────────────────────
    let maskedBearer = 'tvf_••••••••••••'
    if (body.keyId) {
      const key = findKey(body.keyId)
      if (key) {
        maskedBearer = key.maskedKey
      }
    }

    // ── No match → 404 with hint list ──────────────────────────────────
    if (!matched) {
      const suggestion = API_ENDPOINTS.slice(0, 5).map((e) => `${e.method} ${e.path}`)
      const responseBody: PlaygroundResponse = {
        status: 404,
        statusText: 'Not Found',
        latencyMs: 12,
        body: {
          error: 'ENDPOINT_NOT_FOUND',
          message: `No endpoint matches ${method} ${resolvedPath}.`,
          hint: `Try one of: ${suggestion.join(' | ')}`,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${maskedBearer}`,
        },
        source: 'mock',
      }
      return NextResponse.json(responseBody, { status: 200 })
    }

    // ── Simulate latency based on endpoint cost ────────────────────────
    // AI endpoints (content-generate, audience-get) take longer; GETs are fast.
    const baseLatency =
      matched.rateLimitCost >= 5
        ? 1800
        : matched.rateLimitCost >= 3
          ? 640
          : matched.rateLimitCost >= 2
            ? 280
            : 120
    const jitter = Math.round(Math.random() * 80)
    const latencyMs = baseLatency + jitter

    // ── Simulate occasional 5xx for AI endpoints ───────────────────────
    // (Realistic — content-generate fails ~2% of the time when HERMES is busy.)
    if (matched.id === 'content-generate' && Math.random() < 0.05) {
      const responseBody: PlaygroundResponse = {
        status: 503,
        statusText: 'Service Unavailable',
        latencyMs,
        body: {
          error: 'AI_UNAVAILABLE',
          message: 'HERMES model temporarily unavailable. Retry with backoff.',
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${maskedBearer}`,
          'X-RateLimit-Cost': String(matched.rateLimitCost),
        },
        matchedEndpoint: matched,
        source: 'mock',
      }
      return NextResponse.json(responseBody, { status: 200 })
    }

    // ── Success — echo the canned responseExample ──────────────────────
    // For POST/PUT/PATCH we try to parse the supplied JSON body so the
    // response can echo back caller-supplied fields (e.g. productId).
    let parsedBody: unknown = undefined
    if (body.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      try {
        parsedBody = JSON.parse(body.body)
      } catch {
        parsedBody = { _raw: body.body }
      }
    }

    // Customise the response body with caller-supplied context where it
    // makes the playground feel more "real".
    const responseBodyData: Record<string, unknown> = {
      ...matched.responseExample,
    }
    if (matched.id === 'links-create' && typeof parsedBody === 'object' && parsedBody) {
      const pb = parsedBody as Record<string, unknown>
      if (typeof pb.productId === 'string') responseBodyData.productId = pb.productId
      if (typeof pb.campaign === 'string') responseBodyData.campaign = pb.campaign
    }
    if (matched.id === 'content-generate' && typeof parsedBody === 'object' && parsedBody) {
      const pb = parsedBody as Record<string, unknown>
      if (typeof pb.productId === 'string') {
        responseBodyData.caption =
          `Best gila ${pb.productId} ni! Confirm grab sebelum sold out 🔥`
        responseBodyData.hashtags = ['#malaysia', '#affiliate', '#fyp']
      }
    }

    const response: PlaygroundResponse = {
      status: 200,
      statusText: 'OK',
      latencyMs,
      body: responseBodyData,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${maskedBearer}`,
        'X-RateLimit-Cost': String(matched.rateLimitCost),
        'X-Endpoint-Id': matched.id,
      },
      matchedEndpoint: matched,
      source: 'mock',
    }
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[POST /api/apikeys/playground] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to execute playground request.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
