#!/usr/bin/env bash
#
# start-notification-service.sh
#
# Starts the realtime notification mini-service (Socket.io + control API)
# in the background before `next dev` runs. Safe to call repeatedly — if the
# service is already listening on port 3003, this script is a no-op.
#
# Used by the `predev` npm script so the service starts automatically with
# `bun run dev`.
#
# Service ports:
#   3003 — Socket.io server  (frontend connects via io('/?XTransformPort=3003'))
#   3004 — Internal control API (POST /emit, GET /health, GET /stats)
#

set -u

PORT=3003
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$PROJECT_ROOT/mini-services/notification-service"
LOG_FILE="/tmp/notification-service.log"

# Already running? Quick check using curl on the control port (3004).
if curl -sS --max-time 1 "http://localhost:3004/health" >/dev/null 2>&1; then
  echo "[notifications] Already running on :3003 (control API :3004 healthy). Skipping start."
  exit 0
fi

# Belt-and-braces: also check the socket port directly.
if command -v ss >/dev/null 2>&1 && ss -tln 2>/dev/null | grep -q ":${PORT}\b"; then
  echo "[notifications] Port ${PORT} already bound. Skipping start."
  exit 0
fi

if [ ! -d "$SERVICE_DIR" ]; then
  echo "[notifications] Service directory not found at $SERVICE_DIR — skipping."
  exit 0
fi

if [ ! -f "$SERVICE_DIR/node_modules/socket.io/package.json" ]; then
  echo "[notifications] Installing dependencies..."
  (cd "$SERVICE_DIR" && bun install >/dev/null 2>&1) || {
    echo "[notifications] WARN: bun install failed; service may not start."
  }
fi

# Start in a fully detached session so it survives the parent shell exiting.
echo "[notifications] Starting notification service (Socket.io :3003, control :3004)..."
(
  cd "$SERVICE_DIR"
  setsid bun run dev >"$LOG_FILE" 2>&1 < /dev/null &
  disown
)

# Give it a moment to bind the ports, then verify.
for i in 1 2 3 4 5; do
  if curl -sS --max-time 1 "http://localhost:3004/health" >/dev/null 2>&1; then
    echo "[notifications] ✅ Service is healthy (log: $LOG_FILE)"
    exit 0
  fi
  sleep 1
done

echo "[notifications] ⚠️  Service may still be starting up. Check $LOG_FILE if needed."
exit 0
