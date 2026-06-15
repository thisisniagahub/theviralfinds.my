import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const skills = await db.hermesSkill.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const formattedSkills = skills.map((skill) => ({
      ...skill,
      successRate: skill.successRate ? Number(skill.successRate) : null,
    }))

    return NextResponse.json({ skills: formattedSkills, total: formattedSkills.length })
  } catch (error) {
    console.error('Hermes skills GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, code, trigger, status, learnedFrom } = body

    if (!name || !description || !category || !code) {
      return NextResponse.json(
        { error: 'name, description, category, and code are required' },
        { status: 400 }
      )
    }

    const skill = await db.hermesSkill.create({
      data: {
        name,
        description,
        category,
        code,
        trigger: trigger || null,
        status: status || 'draft',
        learnedFrom: learnedFrom || null,
      },
    })

    return NextResponse.json(
      {
        ...skill,
        successRate: skill.successRate ? Number(skill.successRate) : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Hermes skills POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}
