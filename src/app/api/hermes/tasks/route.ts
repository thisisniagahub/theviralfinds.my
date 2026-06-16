import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const tasks = await db.hermesTask.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const formattedTasks = tasks.map((task) => ({
      ...task,
      lastRunAt: task.lastRunAt ? task.lastRunAt.toISOString() : null,
      nextRunAt: task.nextRunAt ? task.nextRunAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))

    return NextResponse.json({ tasks: formattedTasks, total: formattedTasks.length })
  } catch (error) {
    console.error('Hermes tasks GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, schedule, skillId, status, nextRunAt } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const task = await db.hermesTask.create({
      data: {
        name,
        description: description || null,
        schedule: schedule || null,
        skillId: skillId || null,
        status: status || 'scheduled',
        nextRunAt: nextRunAt ? new Date(nextRunAt) : null,
      },
    })

    return NextResponse.json(
      {
        ...task,
        lastRunAt: task.lastRunAt ? task.lastRunAt.toISOString() : null,
        nextRunAt: task.nextRunAt ? task.nextRunAt.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Hermes tasks POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
