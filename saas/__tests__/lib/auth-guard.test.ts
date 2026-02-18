import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { Session } from 'next-auth'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

import { prisma } from '@/lib/db'

const mockFindUnique = vi.mocked(prisma.project.findUnique)

describe('requireProjectAccess', () => {
  const session: Session = {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    expires: '2099-01-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('возвращает проект если пользователь — владелец', async () => {
    const project = {
      id: 'project-1',
      userId: 'user-1',
      name: 'Test Project',
      niche: 'test',
      isDemo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindUnique.mockResolvedValue(project)

    const result = await requireProjectAccess('project-1', session)
    expect(result).toEqual(project)
  })

  it('бросает 404 если проект не найден', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(requireProjectAccess('nonexistent', session)).rejects.toThrow(
      AuthError
    )
    await expect(requireProjectAccess('nonexistent', session)).rejects.toThrow(
      'Project not found'
    )
  })

  it('бросает 403 если проект чужой', async () => {
    const project = {
      id: 'project-2',
      userId: 'other-user',
      name: 'Other Project',
      niche: 'other',
      isDemo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockFindUnique.mockResolvedValue(project)

    try {
      await requireProjectAccess('project-2', session)
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError)
      expect((err as AuthError).status).toBe(403)
    }
  })
})
