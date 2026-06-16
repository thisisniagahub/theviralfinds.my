import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateBody } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'
import { TikTokAffiliateService } from '@/lib/tiktok/affiliate-service'

/**
 * POST /api/tiktok/connect
 * Save TikTok Shop Affiliate API credentials and test connection.
 *
 * Body: { appKey, appSecret, accessToken?, shopId?, region? }
 *
 * NOTE: This is a stub of the OAuth flow — for now the user pastes
 *       credentials directly. A future iteration will replace this with
 *       a real TikTok Shop OAuth dance (`buildTikTokOAuthUrl` +
 *       `exchangeTikTokCodeForToken` from `api-client.ts`).
 */
const tiktokConnectSchema = z.object({
  appKey: z.string().min(1, 'App Key is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  shopId: z.string().optional(),
  region: z.enum(['MY', 'SG', 'ID', 'TH', 'PH', 'VN']).default('MY'),
})

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    const { appKey, appSecret, accessToken, shopId, region } =
      await validateBody(request, tiktokConnectSchema)

    // Persist credentials to AppSetting table
    const settings = [
      { key: 'tiktok_app_key', value: appKey },
      { key: 'tiktok_app_secret', value: appSecret },
      { key: 'tiktok_access_token', value: accessToken },
      { key: 'tiktok_region', value: region },
      ...(shopId ? [{ key: 'tiktok_shop_id', value: shopId }] : []),
    ]

    for (const setting of settings) {
      await db.appSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    // Test the connection (live API call if reachable, else mock)
    const service = new TikTokAffiliateService({
      appKey,
      appSecret,
      accessToken,
      shopId,
      region,
    })

    const testResult = await service.testConnection()

    await db.appSetting.upsert({
      where: { key: 'tiktok_connection_status' },
      update: {
        value: testResult.success && !service.isUsingMock ? 'connected' : 'mock',
      },
      create: {
        key: 'tiktok_connection_status',
        value: testResult.success && !service.isUsingMock ? 'connected' : 'mock',
      },
    })

    if (testResult.success && !service.isUsingMock) {
      await db.appSetting.upsert({
        where: { key: 'tiktok_last_connected' },
        update: { value: new Date().toISOString() },
        create: { key: 'tiktok_last_connected', value: new Date().toISOString() },
      })
    }

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      region: testResult.region,
      source: testResult.source,
      connected: !service.isUsingMock,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/tiktok/connect
 * Get current TikTok Shop connection status.
 */
export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            'tiktok_app_key',
            'tiktok_region',
            'tiktok_shop_id',
            'tiktok_connection_status',
            'tiktok_last_connected',
          ],
        },
      },
    })

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return NextResponse.json({
      connected: settingsMap.tiktok_connection_status === 'connected',
      appKey: settingsMap.tiktok_app_key
        ? `${settingsMap.tiktok_app_key.slice(0, 4)}****`
        : null,
      region: settingsMap.tiktok_region || 'MY',
      shopId: settingsMap.tiktok_shop_id || null,
      lastConnected: settingsMap.tiktok_last_connected || null,
      source: settingsMap.tiktok_connection_status === 'connected' ? 'api' : 'mock',
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/tiktok/connect
 * Disconnect TikTok Shop — purges stored credentials.
 */
export async function DELETE() {
  try {
    const keysToDelete = [
      'tiktok_app_key',
      'tiktok_app_secret',
      'tiktok_access_token',
      'tiktok_shop_id',
      'tiktok_region',
      'tiktok_connection_status',
      'tiktok_last_connected',
      'tiktok_force_mock',
    ]

    for (const key of keysToDelete) {
      await db.appSetting
        .delete({ where: { key } })
        .catch(() => {
          // Ignore not-found — record may not exist
        })
    }

    return NextResponse.json({
      success: true,
      message: 'TikTok Shop disconnected successfully',
    })
  } catch (error) {
    return handleError(error)
  }
}


