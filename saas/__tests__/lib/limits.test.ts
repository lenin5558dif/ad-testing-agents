import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    testRun: { count: vi.fn() },
    persona: { count: vi.fn() },
    offer: { count: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { checkTestLimit, checkPersonaLimit, checkOfferLimit, checkPersonaGenLimit } from '@/lib/limits'

const mockUserFind = vi.mocked(prisma.user.findUnique)
const mockTestRunCount = vi.mocked(prisma.testRun.count)
const mockPersonaCount = vi.mocked(prisma.persona.count)
const mockOfferCount = vi.mocked(prisma.offer.count)

describe('checkTestLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('разрешает если тестов меньше лимита (FREE=5)', async () => {
    mockUserFind.mockResolvedValue({
      id: 'u1', email: 'a@b.com', password: null,
      emailVerified: null, name: null, image: null,
      plan: 'FREE', planExpiresAt: null, createdAt: new Date(),
    })
    mockTestRunCount.mockResolvedValue(3)

    const result = await checkTestLimit('u1')
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(3)
    expect(result.limit).toBe(5)
  })

  it('блокирует если тестов >= лимита', async () => {
    mockUserFind.mockResolvedValue({
      id: 'u1', email: 'a@b.com', password: null,
      emailVerified: null, name: null, image: null,
      plan: 'FREE', planExpiresAt: null, createdAt: new Date(),
    })
    mockTestRunCount.mockResolvedValue(5)

    const result = await checkTestLimit('u1')
    expect(result.allowed).toBe(false)
  })

  it('возвращает false для несуществующего пользователя', async () => {
    mockUserFind.mockResolvedValue(null)

    const result = await checkTestLimit('nonexistent')
    expect(result.allowed).toBe(false)
  })
})

describe('checkPersonaLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('разрешает если персон меньше лимита (FREE=8)', async () => {
    mockPersonaCount.mockResolvedValue(5)
    const allowed = await checkPersonaLimit('p1', 'FREE')
    expect(allowed).toBe(true)
  })

  it('блокирует если >= лимита', async () => {
    mockPersonaCount.mockResolvedValue(8)
    const allowed = await checkPersonaLimit('p1', 'FREE')
    expect(allowed).toBe(false)
  })
})

describe('checkOfferLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('разрешает если офферов меньше лимита (FREE=5)', async () => {
    mockOfferCount.mockResolvedValue(3)
    const allowed = await checkOfferLimit('p1', 'FREE')
    expect(allowed).toBe(true)
  })

  it('блокирует если >= лимита', async () => {
    mockOfferCount.mockResolvedValue(5)
    const allowed = await checkOfferLimit('p1', 'FREE')
    expect(allowed).toBe(false)
  })
})

describe('checkPersonaGenLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('разрешает для AGENCY (unlimited)', async () => {
    const allowed = await checkPersonaGenLimit('u1', 'AGENCY')
    expect(allowed).toBe(true)
  })

  it('разрешает если генераций сегодня < лимита (FREE=3)', async () => {
    mockPersonaCount.mockResolvedValue(2)
    const allowed = await checkPersonaGenLimit('u1', 'FREE')
    expect(allowed).toBe(true)
  })

  it('блокирует если >= лимита', async () => {
    mockPersonaCount.mockResolvedValue(3)
    const allowed = await checkPersonaGenLimit('u1', 'FREE')
    expect(allowed).toBe(false)
  })
})
