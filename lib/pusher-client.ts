// lib/pusher-client.ts
'use client'
import Pusher from 'pusher-js'

let _client: Pusher | null = null

export function getPusherClient() {
  if (_client) return _client

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    console.warn(
      'Missing Pusher client env vars. Required: NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER'
    )
    return null
  }

  _client = new Pusher(key, { cluster })
  return _client
}
