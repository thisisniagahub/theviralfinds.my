/**
 * End-to-end smoke test for the notification service.
 *
 * Verifies that:
 *   1. A client can connect to the Socket.io server (port 3003 via Caddy).
 *   2. The client can join a user room.
 *   3. An emit on the control API (port 3004) is received by the client.
 *
 * Run with: bun mini-services/notification-service/test-e2e.ts
 *
 * NOTE: This is a development debug script, not part of the production build.
 */

import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3003/?XTransformPort=3003'
const CONTROL_URL = 'http://localhost:3004/emit'
const USER_ID = 'e2e-test-user'

console.log('🧪 E2E test starting...')

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
})

let receivedCount = 0
const expectedEvents = ['conversion', 'click', 'notification']

expectedEvents.forEach((event) => {
  socket.on(event, (data: any) => {
    receivedCount++
    console.log(`   ✅ Received "${event}":`, JSON.stringify(data))
  })
})

socket.on('connect', async () => {
  console.log(`✅ Socket connected (id: ${socket.id})`)
  socket.emit('join', USER_ID)
  console.log(`   Joined room user:${USER_ID}`)

  // Wait briefly for the join to be processed, then emit
  await new Promise((r) => setTimeout(r, 300))

  for (const event of expectedEvents) {
    const payload = {
      userId: USER_ID,
      event,
      data: { title: `E2E ${event}`, description: `Test payload for ${event}`, ts: Date.now() },
    }
    const res = await fetch(CONTROL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: any = await res.json()
    console.log(`   📤 Emitted "${event}" → delivered: ${json.delivered}`)
    await new Promise((r) => setTimeout(r, 200))
  }

  // Wait a bit for events to arrive
  await new Promise((r) => setTimeout(r, 500))

  console.log(`\n📊 Received ${receivedCount}/${expectedEvents.length} events`)
  if (receivedCount === expectedEvents.length) {
    console.log('🎉 E2E test PASSED')
    socket.disconnect()
    process.exit(0)
  } else {
    console.log('❌ E2E test FAILED — some events missing')
    socket.disconnect()
    process.exit(1)
  }
})

socket.on('connect_error', (err: any) => {
  console.error('❌ Connection error:', err.message)
  process.exit(1)
})

// Timeout
setTimeout(() => {
  console.error('❌ E2E test timed out after 10s')
  socket.disconnect()
  process.exit(1)
}, 10000)
