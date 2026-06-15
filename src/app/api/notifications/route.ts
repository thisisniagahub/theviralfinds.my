import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
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
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ids, markAll } = body

    if (markAll) {
      await db.notification.updateMany({
        where: { read: false },
        data: { read: true },
      })
      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (ids && Array.isArray(ids)) {
      await db.notification.updateMany({
        where: { id: { in: ids } },
        data: { read: true },
      })
      return NextResponse.json({ message: `${ids.length} notifications marked as read` })
    }

    if (id) {
      const notification = await db.notification.findUnique({ where: { id } })
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      await db.notification.update({
        where: { id },
        data: { read: true },
      })
      return NextResponse.json({ message: 'Notification marked as read' })
    }

    return NextResponse.json(
      { error: 'Provide id, ids, or markAll in request body' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Notifications PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
