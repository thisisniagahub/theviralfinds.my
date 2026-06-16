import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List saved content from library
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')
    const favorite = searchParams.get('favorite')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (platform && platform !== 'all') {
      where.platform = platform
    }

    if (favorite === 'true') {
      where.isFavorite = true
    }

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { product: { contains: search } },
        { niche: { contains: search } },
      ]
    }

    const [items, total] = await Promise.all([
      db.contentLibrary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contentLibrary.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Library fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content library' },
      { status: 500 }
    )
  }
}

// POST - Save content to library
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, platform, niche, product, content, language, tone } = body

    if (!type || !platform || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, platform, content' },
        { status: 400 }
      )
    }

    const item = await db.contentLibrary.create({
      data: {
        type,
        platform,
        niche: niche || null,
        product: product || null,
        content,
        language: language || 'manglish',
        tone: tone || 'casual',
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Library save error:', error)
    return NextResponse.json(
      { error: 'Failed to save content to library' },
      { status: 500 }
    )
  }
}

// PATCH - Update content in library
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, isFavorite } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite

    const item = await db.contentLibrary.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Library update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

// DELETE - Remove content from library
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    await db.contentLibrary.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Library delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}
