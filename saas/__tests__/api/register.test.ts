import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreateDemoProject } = vi.hoisted(() => ({
  mockCreateDemoProject: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed') },
}))

vi.mock('@/lib/onboarding', () => ({
  createDemoProject: mockCreateDemoProject,
}))

import { prisma } from '@/lib/db'

const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockCreate = vi.mocked(prisma.user.create)

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('создаёт пользователя и демо-проект', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test',
      password: 'hashed', image: null, plan: 'FREE',
      planExpiresAt: null, emailVerified: null, createdAt: new Date(), updatedAt: new Date(),
    } as never)
    mockCreateDemoProject.mockResolvedValue({} as never)

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: '123456', name: 'Test' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockCreateDemoProject).toHaveBeenCalledWith('user-1')
  })

  it('регистрация не падает если демо-проект не создался', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test',
      password: 'hashed', image: null, plan: 'FREE',
      planExpiresAt: null, emailVerified: null, createdAt: new Date(), updatedAt: new Date(),
    } as never)
    mockCreateDemoProject.mockRejectedValue(new Error('DB error'))

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: '123456', name: 'Test' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('возвращает 409 если email уже существует', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing' } as never)

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: '123456', name: 'Test' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('возвращает 400 для невалидных данных', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: '12', name: '' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
