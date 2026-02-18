import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockConsume } = vi.hoisted(() => ({
  mockConsume: vi.fn(),
}))

// Mock ioredis
vi.mock('ioredis', () => {
  class MockRedis {
    get = vi.fn()
    set = vi.fn()
    del = vi.fn()
    on = vi.fn()
    disconnect = vi.fn()
  }
  return { default: MockRedis }
})

// Mock rate-limiter-flexible
vi.mock('rate-limiter-flexible', () => {
  class MockRateLimiterRedis {
    consume = mockConsume
    constructor() {}
  }
  return { RateLimiterRedis: MockRateLimiterRedis }
})

import { checkRateLimit, apiLimiter } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('разрешает запрос если лимит не превышен', async () => {
    mockConsume.mockResolvedValue({ remainingPoints: 29 })

    const result = await checkRateLimit(apiLimiter, 'user-1')
    expect(result.allowed).toBe(true)
  })

  it('блокирует запрос если лимит превышен (429)', async () => {
    mockConsume.mockRejectedValue({ msBeforeNext: 30000 })

    const result = await checkRateLimit(apiLimiter, 'user-1')
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBe(30000)
  })

  it('возвращает retryAfterMs по умолчанию если не указано', async () => {
    mockConsume.mockRejectedValue({})

    const result = await checkRateLimit(apiLimiter, 'user-1')
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBe(60000)
  })
})
