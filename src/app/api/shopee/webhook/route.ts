import { NextRequest, NextResponse } from 'next/server'
import { ShopeeAffiliateService } from '@/lib/shopee/affiliate-api'
import { emitConversion, emitClick, emitNotificationGeneric } from '@/lib/realtime/emit'
import { DEMO_USER_ID } from '@/lib/realtime/constants'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

/**
 * POST /api/shopee/webhook
 * Receive Shopee Affiliate webhook events (conversions, clicks, etc.)
 *
 * Setup: Configure this URL in your Shopee Affiliate Dashboard > API > Webhook URL
 * The webhook sends real-time conversion/click notifications.
 *
 * Flow:
 *   Shopee ──HTTP──▶ /api/shopee/webhook ──HTTP──▶ notification-service:3003/emit
 *                                                              │
 *                                                              ▼
 *                                                   Socket.io → user's browser
 *                                                              │
 *                                                              ▼
 *                                              sonner toast + sound + bell badge
 */
export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.webhook)) {
      return enforceRateLimit(request, RATE_LIMITS.webhook)!
    }
    const body = await request.text()
    const signature = request.headers.get('x-shopee-signature') || ''

    // Get secret from DB to verify
    const { db } = await import('@/lib/db')
    const secretSetting = await db.appSetting.findUnique({
      where: { key: 'shopee_secret' }
    })

    if (!secretSetting) {
      throw ApiError.badRequest('Shopee not configured')
    }

    // Verify webhook signature
    const isValid = ShopeeAffiliateService.verifyWebhookSignature(
      body,
      signature,
      secretSetting.value
    )

    if (!isValid) {
      throw ApiError.unauthorized('Invalid webhook signature')
    }

    // Parse the webhook payload (malformed → 400)
    let payload: { event_type?: string; data?: Record<string, unknown> }
    try {
      payload = JSON.parse(body)
    } catch {
      throw ApiError.badRequest('Invalid JSON in webhook payload')
    }

    // Process different event types
    switch (payload.event_type) {
      case 'order_conversion': {
        // A new conversion happened - save to database
        const { order_sn, item_id, item_name, commission, commission_rate } = payload.data

        // Find the affiliate link for this item
        const link = await db.affiliateLink.findFirst({
          where: { productId: item_id.toString() }
        })

        if (link) {
          // Create conversion record
          await db.conversion.create({
            data: {
              linkId: link.id,
              orderId: order_sn,
              amount: commission_rate,
              commission: commission,
              status: 'pending',
            }
          })

          // Update link stats
          await db.affiliateLink.update({
            where: { id: link.id },
            data: {
              conversions: { increment: 1 },
              earnings: { increment: commission },
            }
          })
        }

        // Create notification
        await db.notification.create({
          data: {
            type: 'conversion',
            title: 'New Conversion! 🎉',
            description: `${item_name} - Commission: RM ${commission.toFixed(2)}`,
          }
        })

        // ─── Emit real-time socket event ───────────────────────────────
        // Use the link owner's userId if available, else fall back to demo user.
        const targetUserId = link?.userId || DEMO_USER_ID
        await emitConversion(targetUserId, {
          productName: item_name,
          itemId: item_id?.toString(),
          orderId: order_sn,
          commission: Number(commission) || 0,
          amount: Number(commission_rate) || 0,
        })
        break
      }

      case 'click': {
        // A new click was tracked
        const { item_id, sub_id, item_name } = payload.data

        const clickLink = await db.affiliateLink.findFirst({
          where: { productId: item_id?.toString() }
        })

        if (clickLink) {
          await db.affiliateLink.update({
            where: { id: clickLink.id },
            data: { clicks: { increment: 1 } }
          })

          await db.clickRecord.create({
            data: {
              linkId: clickLink.id,
              referer: sub_id || null,
              converted: false,
            }
          })
        }

        // ─── Emit real-time socket event ───────────────────────────────
        const clickUserId = clickLink?.userId || DEMO_USER_ID
        await emitClick(clickUserId, {
          productName: item_name || clickLink?.productName,
          itemId: item_id?.toString(),
          referer: sub_id,
        })
        break
      }

      case 'commission_update': {
        // Commission status changed (e.g., confirmed, paid)
        const { order_sn, commission_status } = payload.data

        await db.conversion.updateMany({
          where: { orderId: order_sn },
          data: { status: commission_status === 'confirmed' ? 'confirmed' : commission_status === 'paid' ? 'paid' : 'rejected' }
        })

        await db.notification.create({
          data: {
            type: 'commission_update',
            title: `Commission ${commission_status}`,
            description: `Order ${order_sn} commission status updated to ${commission_status}`,
          }
        })

        // ─── Emit real-time socket event (generic notification) ────────
        await emitNotificationGeneric(DEMO_USER_ID, {
          title: `Commission ${commission_status}`,
          description: `Order ${order_sn} commission status updated to ${commission_status}`,
          type: 'commission_update',
        })
        break
      }

      default:
        console.log('Unknown webhook event:', payload.event_type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
