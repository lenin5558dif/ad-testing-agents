import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCheckTestLimit, mockCheckRateLimit } = vi.hoisted(() => ({
  mockCheckTestLimit: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    persona: { findMany: vi.fn() },
    offer: { findMany: vi.fn() },
    testRun: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    personaResponse: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth-guard', () => ({
  requireAuth: vi.fn(),
  requireProjectAccess: vi.fn(),
  AuthError: class AuthError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

vi.mock('@/lib/limits', () => ({
  checkTestLimit: mockCheckTestLimit,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  testLimiter: {},
}))

vi.mock('@/lib/queue/connection', () => ({
  redisConnection: {},
}))

vi.mock('ioredis', () => {
  class MockRedis { constructor() {} }
  return { default: MockRedis }
})

vi.mock('bullmq', () => {
  class MockQueue {
    constructor() {}
    add = vi.fn()
  }
  return { Queue: MockQueue }
})

import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess } from '@/lib/auth-guard'

const mockRequireAuth = vi.mocked(requireAuth)
const mockRequireProjectAccess = vi.mocked(requireProjectAccess)
const mockFindPersonas = vi.mocked(prisma.persona.findMany)
const mockFindOffers = vi.mocked(prisma.offer.findMany)
const mockCreateTestRun = vi.mocked(prisma.testRun.create)
const mockCreatePR = vi.mocked(prisma.personaResponse.create)

describe('POST /api/projects/[id]/test-runs', () => {
  const session = {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    expires: '2099-01-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(session)
    mockRequireProjectAccess.mockResolvedValue({
      id: 'proj-1', userId: 'user-1', name: 'Test', niche: 'test',
      isDemo: false, createdAt: new Date(), updatedAt: new Date(),
    })
    mockCheckRateLimit.mockResolvedValue({ allowed: true })
    mockCheckTestLimit.mockResolvedValue({ allowed: true, used: 0, limit: 5 })
  })

  it('возвращает 400 если нет персон или офферов', async () => {
    mockFindPersonas.mockResolvedValue([])
    mockFindOffers.mockResolvedValue([])

    const { POST } = await import('@/app/api/projects/[id]/test-runs/route')
    const req = new Request('http://localhost/api/projects/proj-1/test-runs', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'proj-1' }) })
    expect(response.status).toBe(400)
  })

  it('создаёт TestRun и правильное количество PersonaResponse', async () => {
    mockFindPersonas.mockResolvedValue([
      { id: 'p1' } as never,
      { id: 'p2' } as never,
    ])
    mockFindOffers.mockResolvedValue([
      { id: 'o1' } as never,
      { id: 'o2' } as never,
      { id: 'o3' } as never,
    ])
    mockCreateTestRun.mockResolvedValue({
      id: 'tr-1', projectId: 'proj-1', status: 'PENDING',
      totalPairs: 6, completedPairs: 0, failedPairs: 0,
      modelUsed: 'test', promptVersion: 'eval-v1', createdAt: new Date(),
    } as never)
    mockCreatePR.mockResolvedValue({ id: 'pr-1' } as never)

    const { POST } = await import('@/app/api/projects/[id]/test-runs/route')
    const req = new Request('http://localhost/api/projects/proj-1/test-runs', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'proj-1' }) })
    expect(response.status).toBe(201)

    // 2 персоны × 3 оффера = 6 пар
    expect(mockCreatePR).toHaveBeenCalledTimes(6)
  })

  it('возвращает 403 если лимит тестов исчерпан', async () => {
    mockCheckTestLimit.mockResolvedValue({ allowed: false, used: 5, limit: 5 })

    const { POST } = await import('@/app/api/projects/[id]/test-runs/route')
    const req = new Request('http://localhost/api/projects/proj-1/test-runs', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'proj-1' }) })
    expect(response.status).toBe(403)
  })

  it('возвращает 429 если rate limit превышен', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfterMs: 30000 })

    const { POST } = await import('@/app/api/projects/[id]/test-runs/route')
    const req = new Request('http://localhost/api/projects/proj-1/test-runs', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'proj-1' }) })
    expect(response.status).toBe(429)
  })
})

describe('GET /api/projects/[id]/test-runs', () => {
  const session = {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    expires: '2099-01-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(session)
    mockRequireProjectAccess.mockResolvedValue({
      id: 'proj-1', userId: 'user-1', name: 'Test', niche: 'test',
      isDemo: false, createdAt: new Date(), updatedAt: new Date(),
    })
  })

  it('возвращает список тестовых запусков', async () => {
    const mockTestRuns = [
      { id: 'tr-1', status: 'COMPLETED', totalPairs: 6, completedPairs: 6, failedPairs: 0, createdAt: new Date() },
      { id: 'tr-2', status: 'RUNNING', totalPairs: 4, completedPairs: 2, failedPairs: 0, createdAt: new Date() },
    ]
    vi.mocked(prisma.testRun.findMany).mockResolvedValue(mockTestRuns as never)

    const { GET } = await import('@/app/api/projects/[id]/test-runs/route')
    const req = new Request('http://localhost/api/projects/proj-1/test-runs')
    const response = await GET(req, { params: Promise.resolve({ id: 'proj-1' }) })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
    expect(data[0].status).toBe('COMPLETED')
  })
})
