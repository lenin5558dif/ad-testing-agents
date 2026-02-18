import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Redis from 'ioredis'

export async function GET() {
  const status: Record<string, string> = { status: 'ok' }

  try {
    await prisma.$queryRaw`SELECT 1`
    status.db = 'ok'
  } catch {
    status.db = 'error'
    status.status = 'degraded'
  }

  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    await redis.ping()
    await redis.disconnect()
    status.redis = 'ok'
  } catch {
    status.redis = 'error'
    status.status = 'degraded'
  }

  return NextResponse.json(status, {
    status: status.status === 'ok' ? 200 : 503,
  })
}
