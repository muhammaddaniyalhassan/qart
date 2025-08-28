// lib/pusher.ts
import type Pusher from 'pusher'

// Avoid initializing at import time; do it on first use.
let _pusher: Pusher | null = null

export function getPusherServer() {
  if (_pusher) return _pusher

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    throw new Error(
      'Missing Pusher server env vars. Required: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER'
    )
  }

  // Lazy import so the module can be loaded safely at build time.
  // (Next only runs this when the function is actually called at runtime.)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PusherServer = require('pusher')

  _pusher = new PusherServer({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  })

  return _pusher
}
