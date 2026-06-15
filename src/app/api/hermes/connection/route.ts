import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const connection = await db.hermesConnection.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!connection) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        connection: null,
      })
    }

    return NextResponse.json({
      connected: connection.status === 'connected',
      status: connection.status,
      connection: {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
        model: connection.model,
        isActive: connection.isActive,
        lastConnected: connection.lastConnected
          ? connection.lastConnected.toISOString()
          : null,
      },
    })
  } catch (error) {
    console.error('Hermes connection GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connection status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, apiKey, model, name } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint URL is required' },
        { status: 400 }
      )
    }

    // Test connection by trying to create a simple AI request
    let isConnected = false
    let latency = 0

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const startTime = Date.now()
      const zai = await ZAI.create()
      await zai.chat.completions.create({
        messages: [
          { role: 'user', content: 'ping' },
        ],
        thinking: { type: 'disabled' },
      })
      latency = Date.now() - startTime
      isConnected = true
    } catch {
      isConnected = false
    }

    // Deactivate existing connections
    await db.hermesConnection.updateMany({
      where: { isActive: true },
      data: { isActive: false, status: 'disconnected' },
    })

    // Save or update connection
    const connection = await db.hermesConnection.create({
      data: {
        name: name || 'Hermes Connection',
        endpoint,
        apiKey: apiKey || null,
        model: model || 'hermes-3',
        isActive: isConnected,
        status: isConnected ? 'connected' : 'disconnected',
        lastConnected: isConnected ? new Date() : null,
      },
    })

    return NextResponse.json({
      connected: isConnected,
      latency,
      connection: {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
        model: connection.model,
        isActive: connection.isActive,
        status: connection.status,
        lastConnected: connection.lastConnected
          ? connection.lastConnected.toISOString()
          : null,
      },
    })
  } catch (error) {
    console.error('Hermes connection POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save connection settings' },
      { status: 500 }
    )
  }
}
