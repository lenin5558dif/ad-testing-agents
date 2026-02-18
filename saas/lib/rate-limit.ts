import { RateLimiterRedis } from 'rate-limiter-flexible'
import Redis from 'ioredis'

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// 30 запросов в минуту на пользователя
export const apiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:api',
  points: 30,
  duration: 60,
})

// 3 тест-рана в минуту на пользователя
export const testLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:test',
  points: 3,
  duration: 60,
})

export async function checkRateLimit(
  limiter: RateLimiterRedis,
  key: string
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  try {
    await limiter.consume(key)
    return { allowed: true }
  } catch (rateLimiterRes: unknown) {
    const res = rateLimiterRes as { msBeforeNext?: number }
    return {
      allowed: false,
      retryAfterMs: res.msBeforeNext || 60000,
    }
  }
}
