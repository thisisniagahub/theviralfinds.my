import { NextRequest, NextResponse } from 'next/server'
import { getLazadaServiceFromDB } from '@/lib/lazada/affiliate-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * OAuth Connect/Disconnect Stubs for Lazada Affiliate Integration.
 *
 * Production flow:
 *   1. POST /api/lazada/connect → returns OAuth authorize URL
 *   2. User grants access on Lazada → Lazada redirects to /api/social/callback/lazada
 *   3. Callback handler exchanges code for access_token (saved to AppSetting table)
 *   4. POST /api/lazada/connect/test → tests the connection
 *   5. DELETE /api/lazada/connect → removes credentials
 *
 * For this Wave 1 (Wave 2.2), we provide a minimal stub that:
 *   - Validates the appKey/appSecret/region payload
 *   - Saves to AppSetting table (if available)
 *   - Tests the connection (which returns mock success when no real creds)
 *   - Returns source: 'mock' | 'api'
 */

interface ConnectRequestBody {
  appKey?: string
  appSecret?: string
  region?: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn'
  accessToken?: string
}

/**
 * POST /api/lazada/connect
 * Save Lazada credentials and test the connection.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    let body: ConnectRequestBody
    try {
      body = await request.json()
    } catch {
      throw ApiError.badRequest('Invalid JSON in request body')
    }

    const { appKey, appSecret, region = 'my', accessToken } = body

    if (!appKey || !appSecret) {
      throw ApiError.badRequest('appKey and appSecret are required')
    }

    // Save credentials to AppSetting table (gracefully skip if DB unavailable)
    try {
      const { db } = await import('@/lib/db')
      const settings = [
        { key: 'lazada_app_key', value: appKey },
        { key: 'lazada_app_secret', value: appSecret },
        { key: 'lazada_region', value: region.toLowerCase() },
        ...(accessToken ? [{ key: 'lazada_access_token', value: accessToken }] : []),
      ]

      for (const s of settings) {
        await db.appSetting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value },
        })
      }

      await db.appSetting.upsert({
        where: { key: 'lazada_connection_status' },
        update: { value: 'connected' },
        create: { key: 'lazada_connection_status', value: 'connected' },
      })
      await db.appSetting.upsert({
        where: { key: 'lazada_last_connected' },
        update: { value: new Date().toISOString() },
        create: { key: 'lazada_last_connected', value: new Date().toISOString() },
      })
    } catch (dbError) {
      console.error('Failed to save Lazada credentials to DB (non-fatal):', dbError)
    }

    // Test the connection
    const service = await getLazadaServiceFromDB()
    const testResult = await service.testConnection()

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      region: testResult.region,
      source: testResult.source,
      connected: testResult.success,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/lazada/connect
 * Disconnect — remove Lazada credentials from AppSetting.
 */
export async function DELETE(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, RATE_LIMITS.write)
    if (limited) return limited

    try {
      const { db } = await import('@/lib/db')
      await db.appSetting.deleteMany({
        where: {
          key: {
            in: [
              'lazada_app_key',
              'lazada_app_secret',
              'lazada_access_token',
              'lazada_connection_status',
              'lazada_last_connected',
            ],
          },
        },
      })
    } catch (dbError) {
      console.error('Failed to remove Lazada credentials from DB (non-fatal):', dbError)
    }

    return NextResponse.json({
      success: true,
      message: 'Lazada account disconnected',
      connected: false,
      source: 'mock',
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/lazada/connect
 * Get current Lazada connection status.
 */
export async function GET() {
  try {
    let connected = false
    let maskedAppKey: string | null = null
    let region = 'my'
    let lastConnected: string | null = null

    try {
      const { db } = await import('@/lib/db')
      const settings = await db.appSetting.findMany({
        where: {
          key: {
            in: [
              'lazada_app_key',
              'lazada_region',
              'lazada_connection_status',
              'lazada_last_connected',
            ],
          },
        },
      })
      const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
      connected = map.lazada_connection_status === 'connected'
      maskedAppKey = map.lazada_app_key
        ? `${map.lazada_app_key.slice(0, 4)}****`
        : null
      region = map.lazada_region || 'my'
      lastConnected = map.lazada_last_connected || null
    } catch (dbError) {
      console.error('Failed to read Lazada status from DB (non-fatal):', dbError)
    }

    return NextResponse.json({
      connected,
      appKey: maskedAppKey,
      region,
      lastConnected,
      source: connected ? 'api' : 'mock',
    })
  } catch (error) {
    return handleError(error)
  }
}
