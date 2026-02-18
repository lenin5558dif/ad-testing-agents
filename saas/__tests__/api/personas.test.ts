import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    persona: {
      findFirst: vi.fn(),
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
import { requireAuth, requireProjectAccess } from '@/lib/auth-guard'

const mockRequireAuth = vi.mocked(requireAuth)
const mockRequireProjectAccess = vi.mocked(requireProjectAccess)
const mockFindFirst = vi.mocked(prisma.persona.findFirst)
const mockUpdate = vi.mocked(prisma.persona.update)
const mockDelete = vi.mocked(prisma.persona.delete)

const session = {
  user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
  expires: '2099-01-01',
}

const validPersona = {
  name: 'Тест',
  description: 'Описание',
  ageGroup: '30-39',
  incomeLevel: 'medium',
  occupation: 'Разработчик',
  personalityTraits: ['analytical'],
  values: ['качество'],
  painPoints: ['стресс'],
  goals: ['рост'],
  triggersPositive: 'Скидки',
  triggersNegative: 'Дорого',
  decisionFactors: ['цена'],
  backgroundStory: 'История',
}

describe('Persona [personaId] API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(session)
    mockRequireProjectAccess.mockResolvedValue({
      id: 'proj-1', userId: 'user-1', name: 'Test', niche: 'test',
      isDemo: false, createdAt: new Date(), updatedAt: new Date(),
    })
  })

  describe('PUT /api/projects/[id]/personas/[personaId]', () => {
    it('обновляет персону с валидными данными', async () => {
      mockFindFirst.mockResolvedValue({ id: 'pers-1', projectId: 'proj-1' } as never)
      mockUpdate.mockResolvedValue({ id: 'pers-1', ...validPersona } as never)

      const { PUT } = await import('@/app/api/projects/[id]/personas/[personaId]/route')
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPersona),
      })

      const res = await PUT(req, { params: Promise.resolve({ id: 'proj-1', personaId: 'pers-1' }) })
      expect(res.status).toBe(200)
    })

    it('возвращает 404 если персона не найдена', async () => {
      mockFindFirst.mockResolvedValue(null)

      const { PUT } = await import('@/app/api/projects/[id]/personas/[personaId]/route')
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPersona),
      })

      const res = await PUT(req, { params: Promise.resolve({ id: 'proj-1', personaId: 'missing' }) })
      expect(res.status).toBe(404)
    })

    it('возвращает 400 для невалидных данных', async () => {
      mockFindFirst.mockResolvedValue({ id: 'pers-1', projectId: 'proj-1' } as never)

      const { PUT } = await import('@/app/api/projects/[id]/personas/[personaId]/route')
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      })

      const res = await PUT(req, { params: Promise.resolve({ id: 'proj-1', personaId: 'pers-1' }) })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/projects/[id]/personas/[personaId]', () => {
    it('удаляет персону', async () => {
      mockFindFirst.mockResolvedValue({ id: 'pers-1', projectId: 'proj-1' } as never)
      mockDelete.mockResolvedValue({ id: 'pers-1' } as never)

      const { DELETE } = await import('@/app/api/projects/[id]/personas/[personaId]/route')
      const req = new Request('http://localhost', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1', personaId: 'pers-1' }) })
      expect(res.status).toBe(200)
    })

    it('возвращает 404 если персона не найдена', async () => {
      mockFindFirst.mockResolvedValue(null)

      const { DELETE } = await import('@/app/api/projects/[id]/personas/[personaId]/route')
      const req = new Request('http://localhost', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1', personaId: 'missing' }) })
      expect(res.status).toBe(404)
    })

    it('возвращает 409 при FK constraint (P2003)', async () => {
      mockFindFirst.mockResolvedValue({ id: 'pers-1', projectId: 'proj-1' } as never)
      const prismaError = new Error('FK constraint')
      ;(prismaError as unknown as { code: string }).code = 'P2003'
      mockDelete.mockRejectedValue(prismaError)

      const { DELETE } = await import('@/app/api/projects/[id]/personas/[personaId]/route')
      const req = new Request('http://localhost', { method: 'DELETE' })

      const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1', personaId: 'pers-1' }) })
      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toContain('используется в тестах')
    })
  })
})
