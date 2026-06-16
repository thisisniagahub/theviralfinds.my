import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const sessionId = searchParams.get('sessionId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (agentId) {
      where.agentId = agentId
    }
    if (sessionId) {
      where.sessionId = sessionId
    }
    if (search) {
      where.content = { contains: search }
    }

    const memories = await db.agentMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formattedMemories = memories.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }))

    return NextResponse.json({ memories: formattedMemories, total: formattedMemories.length })
  } catch (error) {
    console.error('Hermes memory GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memory entries' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Memory entry ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.agentMemory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Memory entry not found' },
        { status: 404 }
      )
    }

    await db.agentMemory.delete({ where: { id } })

    return NextResponse.json({ message: 'Memory entry deleted successfully' })
  } catch (error) {
    console.error('Hermes memory DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete memory entry' },
      { status: 500 }
    )
  }
}
