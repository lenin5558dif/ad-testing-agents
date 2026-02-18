import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules
vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
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
      this.name = 'AuthError'
    }
  },
}))

import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'

const mockRequireAuth = vi.mocked(requireAuth)
const mockRequireProjectAccess = vi.mocked(requireProjectAccess)
const mockFindMany = vi.mocked(prisma.project.findMany)
const mockCreate = vi.mocked(prisma.project.create)

describe('Projects API', () => {
  const session = {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    expires: '2099-01-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(session)
  })

  describe('GET /api/projects', () => {
    it('возвращает список проектов пользователя', async () => {
      const projects = [
        { id: 'p1', name: 'Test', niche: 'test', userId: 'user-1', _count: { personas: 0, offers: 0, testRuns: 0 } },
      ]
      mockFindMany.mockResolvedValue(projects as never)

      // Динамический импорт чтобы моки применились
      const { GET } = await import('@/app/api/projects/route')
      const response = await GET()
      const data = await response.json()

      expect(data).toEqual(projects)
    })

    it('возвращает 401 для неавторизованного', async () => {
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

      const { GET } = await import('@/app/api/projects/route')
      const response = await GET()

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/projects', () => {
    it('создаёт проект с валидными данными', async () => {
      const project = { id: 'p1', name: 'Тест', niche: 'ниша', userId: 'user-1' }
      mockCreate.mockResolvedValue(project as never)

      const { POST } = await import('@/app/api/projects/route')
      const req = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Тест', niche: 'ниша' }),
      })

      const response = await POST(req)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.name).toBe('Тест')
    })

    it('возвращает 400 для невалидных данных', async () => {
      const { POST } = await import('@/app/api/projects/route')
      const req = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', niche: '' }),
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
    })
  })
})
