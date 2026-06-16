import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/autopost - Create a scheduled post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caption, platforms, scheduledAt, productUrl, affiliateLink, imageUrl, hashtags } = body

    if (!caption || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Caption and at least one platform are required' },
        { status: 400 }
      )
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'scheduledAt is required' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduledAt date' },
        { status: 400 }
      )
    }

    // Try to generate affiliate link if productUrl is provided but no affiliateLink
    let finalAffiliateLink = affiliateLink || null
    if (productUrl && !affiliateLink) {
      try {
        const linkRes = await fetch(new URL('/api/shopee/generate-link', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productUrl }),
        })
        if (linkRes.ok) {
          const linkData = await linkRes.json()
          if (linkData.link?.generateUrl) {
            finalAffiliateLink = linkData.link.generateUrl
          }
        }
      } catch {
        // Non-fatal: affiliate link generation failed
      }
    }

    const post = await db.scheduledPost.create({
      data: {
        caption,
        platforms: JSON.stringify(platforms),
        productUrl: productUrl || null,
        affiliateLink: finalAffiliateLink,
        imageUrl: imageUrl || null,
        hashtags: hashtags ? JSON.stringify(hashtags) : null,
        status: 'scheduled',
        scheduledAt: scheduledDate,
      },
    })

    return NextResponse.json({
      ...post,
      platforms: JSON.parse(post.platforms),
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating scheduled post:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled post' },
      { status: 500 }
    )
  }
}

// GET /api/autopost - List scheduled posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && ['scheduled', 'published', 'failed'].includes(status)) {
      where.status = status
    }
    if (platform) {
      // Search for platform in JSON array string
      where.platforms = { contains: platform }
    }

    const [posts, total] = await Promise.all([
      db.scheduledPost.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      db.scheduledPost.count({ where }),
    ])

    const parsedPosts = posts.map((post) => ({
      ...post,
      platforms: JSON.parse(post.platforms),
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
      result: post.result ? JSON.parse(post.result) : null,
    }))

    return NextResponse.json({
      posts: parsedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}
