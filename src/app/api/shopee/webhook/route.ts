import { NextRequest, NextResponse } from 'next/server'
import { ShopeeAffiliateService } from '@/lib/shopee/affiliate-api'

/**
 * POST /api/shopee/webhook
 * Receive Shopee Affiliate webhook events (conversions, clicks, etc.)
 * 
 * Setup: Configure this URL in your Shopee Affiliate Dashboard > API > Webhook URL
 * The webhook sends real-time conversion/click notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopee-signature') || ''

    // Get secret from DB to verify
    const { db } = await import('@/lib/db')
    const secretSetting = await db.appSetting.findUnique({
      where: { key: 'shopee_secret' }
    })

    if (!secretSetting) {
      return NextResponse.json({ error: 'Shopee not configured' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = ShopeeAffiliateService.verifyWebhookSignature(
      body,
      signature,
      secretSetting.value
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse the webhook payload
    const payload = JSON.parse(body)

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
        break
      }

      case 'click': {
        // A new click was tracked
        const { item_id, sub_id } = payload.data

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
        break
      }

      default:
        console.log('Unknown webhook event:', payload.event_type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shopee webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
