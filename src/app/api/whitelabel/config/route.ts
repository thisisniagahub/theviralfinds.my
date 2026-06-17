/**
 * White-Label Configuration API
 *
 * Fasa 4.4 (CHECKLIST Section 4.4 — White-Label Option).
 *
 * Endpoints:
 *   - GET  /api/whitelabel/config          → current org's config + source
 *   - POST /api/whitelabel/config          → create / update current org's config
 *   - GET  /api/whitelabel/config?list=1   → super-admin list of all tenants
 *
 * For Fasa 4.4 we keep the configs in an in-memory Map keyed by orgId (the
 * demo "current org" is `org-shophijau`). In production these would map to
 * a `WhiteLabelConfig` Prisma model — see CHECKLIST 4.4.1.
 */

import { NextRequest, NextResponse } from 'next/server'

import { mergeWithDefaults, validateDomain } from '@/lib/whitelabel/applier'
import {
  ALL_WHITELABEL_CONFIGS,
  getConfigByOrgId,
  SHOPIJAU_CONFIG,
} from '@/lib/whitelabel/mock-data'
import type {
  SaveWhiteLabelConfigRequest,
  SaveWhiteLabelConfigResponse,
  WhiteLabelConfig,
  WhiteLabelConfigResponse,
  WhiteLabelListResponse,
} from '@/lib/whitelabel/types'

/**
 * The "current" org id. In a real deployment this would come from the
 * authenticated session (e.g. `auth().user.orgId`). For the demo we use
 * ShopHijau's org id so the admin UI shows a fully-populated config.
 */
const CURRENT_ORG_ID = 'org-shophijau'

/**
 * In-memory store seeded from the mock data. Writes via POST update the
 * entry in this map so subsequent GETs return the persisted state.
 */
const store = new Map<string, WhiteLabelConfig>()
for (const c of ALL_WHITELABEL_CONFIGS) {
  store.set(c.orgId, { ...c })
}

/* ------------------------------------------------------------------ */
/* GET                                                                  */
/* ------------------------------------------------------------------ */

/**
 * GET /api/whitelabel/config
 * GET /api/whitelabel/config?list=1   (super-admin — returns all tenants)
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const isList = searchParams.get('list') === '1'

    if (isList) {
      // Super-admin view: all tenants, sorted by creation date desc.
      const configs = Array.from(store.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      const body: WhiteLabelListResponse = {
        configs,
        count: configs.length,
        source: 'mock',
      }
      return NextResponse.json(body, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }

    // Regular tenant view: just the current org's config.
    const config = store.get(CURRENT_ORG_ID) ?? getConfigByOrgId(CURRENT_ORG_ID) ?? SHOPIJAU_CONFIG
    const body: WhiteLabelConfigResponse = {
      config,
      source: 'mock',
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[GET /api/whitelabel/config] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch white-label config.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}

/* ------------------------------------------------------------------ */
/* POST                                                                 */
/* ------------------------------------------------------------------ */

/**
 * POST /api/whitelabel/config
 *
 * Body: SaveWhiteLabelConfigRequest
 *   { config: Partial<WhiteLabelConfig> }
 *
 * Validates the supplied partial config (especially the custom domain) and
 * persists it into the in-memory store under the current org id. Returns
 * the full merged config + source flag.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: SaveWhiteLabelConfigRequest
    try {
      body = (await request.json()) as SaveWhiteLabelConfigRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { config: Partial<WhiteLabelConfig> }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!body || !body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        {
          error: 'Field "config" is required (object).',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // Validate the custom domain (if supplied).
    if (body.config.domain?.domain !== undefined) {
      const d = body.config.domain.domain.trim()
      if (d !== '' && !validateDomain(d)) {
        return NextResponse.json(
          {
            error: `Domain tidak sah: "${d}". Sila semak format (cth: affiliate.brand.my).`,
            source: 'mock' as const,
          },
          { status: 400 },
        )
      }
      // Auto-transition status when a domain is set/saved.
      if (body.config.domain.status === undefined) {
        const existing = store.get(CURRENT_ORG_ID)
        const prev = existing?.domain
        if (d === '') {
          body.config.domain.status = 'not_configured'
          body.config.domain.sslStatus = 'none'
        } else if (prev?.domain === d && prev?.status) {
          // keep existing status if domain unchanged
          body.config.domain.status = prev.status
          body.config.domain.sslStatus = prev.sslStatus
        } else {
          // new domain → start as pending until DNS verifies
          body.config.domain.status = 'pending'
          body.config.domain.sslStatus = 'pending'
          body.config.domain.lastVerifiedAt = new Date().toISOString()
        }
      }
    }

    const existing =
      store.get(CURRENT_ORG_ID) ??
      getConfigByOrgId(CURRENT_ORG_ID) ??
      SHOPIJAU_CONFIG

    const merged: Omit<WhiteLabelConfig, 'id' | 'orgId' | 'createdAt'> =
      mergeWithDefaults({
        ...existing,
        ...body.config,
        colors: { ...existing.colors, ...(body.config.colors ?? {}) },
        domain: { ...existing.domain, ...(body.config.domain ?? {}) },
        emailTemplates: body.config.emailTemplates ?? existing.emailTemplates,
      })

    const now = new Date().toISOString()
    const next: WhiteLabelConfig = {
      ...merged,
      id: existing.id,
      orgId: existing.orgId,
      createdAt: existing.createdAt,
      updatedAt: now,
    }

    store.set(CURRENT_ORG_ID, next)

    const response: SaveWhiteLabelConfigResponse = {
      config: next,
      source: 'mock',
    }
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[POST /api/whitelabel/config] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save white-label config.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
