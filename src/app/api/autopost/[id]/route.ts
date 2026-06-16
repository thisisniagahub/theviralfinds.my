import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/autopost/[id] - Update a scheduled post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.scheduledPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.caption !== undefined) data.caption = body.caption
    if (body.platforms !== undefined) data.platforms = JSON.stringify(body.platforms)
    if (body.productUrl !== undefined) data.productUrl = body.productUrl
    if (body.affiliateLink !== undefined) data.affiliateLink = body.affiliateLink
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
    if (body.hashtags !== undefined) data.hashtags = body.hashtags ? JSON.stringify(body.hashtags) : null
    if (body.scheduledAt !== undefined) {
      const scheduledDate = new Date(body.scheduledAt)
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 })
      }
      data.scheduledAt = scheduledDate
    }
    if (body.status !== undefined) {
      if (!['scheduled', 'publishing', 'published', 'failed'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      data.status = body.status
      if (body.status === 'published') {
        data.publishedAt = new Date()
      }
    }
    if (body.result !== undefined) data.result = JSON.stringify(body.result)

    const updated = await db.scheduledPost.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ...updated,
      platforms: JSON.parse(updated.platforms),
      hashtags: updated.hashtags ? JSON.parse(updated.hashtags) : [],
      result: updated.result ? JSON.parse(updated.result) : null,
    })
  } catch (error) {
    console.error('Error updating scheduled post:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    )
  }
}

// DELETE /api/autopost/[id] - Delete a scheduled post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.scheduledPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await db.scheduledPost.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    console.error('Error deleting scheduled post:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled post' },
      { status: 500 }
    )
  }
}
