/**
 * Notification Mini-Service — TheViralFindsMY
 *
 * Real-time WebSocket server for delivering instant notifications to clients.
 *
 * Architecture:
 *   - Port 3003: Socket.io server (path: '/' — required by Caddy gateway).
 *                 Frontend connects via `io('/?XTransformPort=3003')`.
 *   - Port 3004: Internal HTTP control API (server-to-server only).
 *                 Next.js API routes POST to `http://localhost:3004/emit`.
 *
 * Why two ports?
 *   Socket.io with `path: '/'` intercepts ALL HTTP requests on its port
 *   (engine.io's `attach()` checks `path === req.url.slice(0, path.length)`,
 *   which is always true for `path: '/'`). To avoid this collision we expose
 *   the internal control API on a separate port.
 *
 * Event types:
 *   - conversion       : New affiliate conversion (commission earned)
 *   - click            : Affiliate link clicked
 *   - commission_xtra  : Commission XTRA product alert
 *   - hermes_insight   : HERMES AI generated insight
 *   - notification     : Generic notification
 */

import { Server } from 'socket.io'
import { createServer, IncomingMessage, ServerResponse } from 'http'

// ─── Types ─────────────────────────────────────────────────────────────────

export type NotificationEvent =
  | 'conversion'
  | 'click'
  | 'commission_xtra'
  | 'hermes_insight'
  | 'notification'

interface EmitRequest {
  userId?: string
  room?: string // optional: broadcast to a custom room instead of user:{userId}
  event?: NotificationEvent | string
  data?: unknown
  broadcast?: boolean // optional: emit to all connected clients
}

// ─── In-memory pending notifications (for offline users) ───────────────────

const pendingNotifications = new Map<string, Array<{ event: string; data: unknown; ts: number }>>()

// ─── Socket.io server (port 3003) ──────────────────────────────────────────

const io = new Server({
  // CRITICAL: path must be '/' so Caddy can forward correctly
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
})

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`)

  socket.on('join', (userId: string) => {
    if (!userId || typeof userId !== 'string') return
    socket.join(`user:${userId}`)
    socket.data.userId = userId
    console.log(`👤 User ${userId} joined room user:${userId}`)

    // Flush pending notifications
    const pending = pendingNotifications.get(userId) || []
    if (pending.length > 0) {
      console.log(`📬 Delivering ${pending.length} pending notification(s) to user ${userId}`)
      pending.forEach((notif) => {
        socket.emit(notif.event, notif.data)
      })
      pendingNotifications.delete(userId)
    }
  })

  socket.on('leave', (userId: string) => {
    if (!userId) return
    socket.leave(`user:${userId}`)
    console.log(`👋 User ${userId} left room user:${userId}`)
  })

  socket.on('ping-server', () => {
    socket.emit('pong-server', { ts: Date.now() })
  })

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`)
  })

  socket.on('error', (err) => {
    console.error(`Socket error (${socket.id}):`, err)
  })
})

// ─── Internal control API (port 3004) ──────────────────────────────────────

const controlServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS pre-flight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // GET /health — health check
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        service: 'notification-service',
        status: 'ok',
        uptime: process.uptime(),
        connectedClients: io.engine.clientsCount,
        pendingUsers: pendingNotifications.size,
        timestamp: new Date().toISOString(),
      }),
    )
    return
  }

  // POST /emit — internal endpoint for Next.js API routes / other services
  if (req.method === 'POST' && req.url === '/emit') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      // Guard against huge payloads
      if (body.length > 1e6) {
        req.destroy()
        res.writeHead(413)
        res.end('Payload too large')
      }
    })
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body) as EmitRequest
        const { userId, room, event, data, broadcast } = payload

        if (!event) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, error: 'Missing event' }))
          return
        }

        if (broadcast) {
          io.emit(event, data)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, delivered: 'broadcast' }))
          return
        }

        if (!userId && !room) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, error: 'Missing userId or room' }))
          return
        }

        const targetRoom = room || `user:${userId}`

        // Try to deliver live; if user offline, store as pending
        const connectedSockets = await io.in(targetRoom).fetchSockets()
        if (connectedSockets.length === 0 && userId) {
          const pending = pendingNotifications.get(userId) || []
          pending.push({ event, data, ts: Date.now() })
          // Cap pending queue at 50 entries per user
          if (pending.length > 50) pending.shift()
          pendingNotifications.set(userId, pending)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              success: true,
              delivered: 'pending',
              message: 'User offline — queued for delivery on reconnect',
            }),
          )
          return
        }

        io.to(targetRoom).emit(event, data)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, delivered: 'live' }))
      } catch (err) {
        console.error('[/emit] JSON parse error:', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }))
      }
    })
    req.on('error', () => {
      res.writeHead(500)
      res.end('Request error')
    })
    return
  }

  // GET /stats — extended stats (for debugging)
  if (req.method === 'GET' && req.url === '/stats') {
    const pendingBreakdown: Record<string, number> = {}
    for (const [userId, items] of pendingNotifications.entries()) {
      pendingBreakdown[userId] = items.length
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        connectedClients: io.engine.clientsCount,
        pendingUsers: pendingNotifications.size,
        pendingBreakdown,
        uptime: process.uptime(),
      }),
    )
    return
  }

  // Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      error: 'Not found',
      endpoints: ['GET /health', 'POST /emit', 'GET /stats'],
    }),
  )
})

// ─── Periodic cleanup of stale pending notifications (> 24h old) ───────────

const DAY_MS = 24 * 60 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  for (const [userId, items] of pendingNotifications.entries()) {
    const fresh = items.filter((it) => now - it.ts < DAY_MS)
    if (fresh.length === 0) {
      pendingNotifications.delete(userId)
      cleaned += items.length
    } else if (fresh.length !== items.length) {
      pendingNotifications.set(userId, fresh)
      cleaned += items.length - fresh.length
    }
  }
  if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} stale pending notification(s)`)
}, 60 * 60 * 1000) // hourly

// ─── Start ─────────────────────────────────────────────────────────────────

const SOCKET_PORT = 3003
const CONTROL_PORT = 3004

io.listen(SOCKET_PORT)
console.log(`🔔 Notification service (Socket.io) running on port ${SOCKET_PORT}`)
console.log(`   WebSocket: ws://localhost:${SOCKET_PORT}/  (frontend uses io('/?XTransformPort=3003'))`)

controlServer.listen(CONTROL_PORT, () => {
  console.log(`🎛️  Control API running on port ${CONTROL_PORT}`)
  console.log(`   Internal emit: POST http://localhost:${CONTROL_PORT}/emit`)
  console.log(`   Health check:  GET http://localhost:${CONTROL_PORT}/health`)
  console.log(`   Stats:         GET http://localhost:${CONTROL_PORT}/stats`)
})

// ─── Graceful shutdown ─────────────────────────────────────────────────────

const shutdown = (signal: string) => {
  console.log(`\n${signal} received — shutting down notification service...`)
  io.close(() => {
    controlServer.close(() => {
      console.log('✅ Notification service closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
