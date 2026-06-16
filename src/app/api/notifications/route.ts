import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { validateBody, updateNotificationsSchema } from '@/lib/validation'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError, ApiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await db.notification.count({
      where: { read: false },
    })

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        description: n.description,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      unreadCount,
      total: notifications.length,
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const { id, ids, markAll } = await validateBody(request, updateNotificationsSchema)

    if (markAll) {
      const result = await db.notification.updateMany({
        where: { read: false },
        data: { read: true },
      })
      return NextResponse.json({ message: `${result.count} notifications marked as read` })
    }

    if (ids && ids.length > 0) {
      const result = await db.notification.updateMany({
        where: { id: { in: ids } },
        data: { read: true },
      })
      return NextResponse.json({ message: `${result.count} notifications marked as read` })
    }

    if (id) {
      const notification = await db.notification.findUnique({ where: { id } })
      if (!notification) {
        throw ApiError.notFound('Notification not found')
      }
      await db.notification.update({
        where: { id },
        data: { read: true },
      })
      return NextResponse.json({ message: 'Notification marked as read' })
    }

    // Unreachable due to schema refine(), but satisfy TS
    throw ApiError.badRequest('Provide id, ids, or markAll in request body')
  } catch (error) {
    return handleError(error)
  }
}
