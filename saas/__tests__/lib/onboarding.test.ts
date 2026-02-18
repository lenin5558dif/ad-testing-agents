import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    project: { create: mockCreate },
    persona: { create: mockCreate },
    offer: { create: mockCreate },
    testRun: { create: mockCreate },
    personaResponse: { create: mockCreate },
  },
}))

import { createDemoProject } from '@/lib/onboarding'

describe('createDemoProject', () => {
  let callIndex: number

  beforeEach(() => {
    callIndex = 0
    mockCreate.mockReset()
    mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
      callIndex++
      return Promise.resolve({ id: `mock-id-${callIndex}`, ...data })
    })
  })

  it('создаёт проект с isDemo=true', async () => {
    await createDemoProject('user-1')

    // Первый вызов — создание проекта
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          isDemo: true,
          name: 'Кофейня (демо)',
        }),
      })
    )
  })

  it('создаёт 4 персоны', async () => {
    await createDemoProject('user-1')

    // 1 project + 4 personas + 3 offers + 1 testRun + 12 responses = 21
    const calls = mockCreate.mock.calls
    const personaCalls = calls.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0]?.data?.ageGroup !== undefined
    )
    expect(personaCalls).toHaveLength(4)
  })

  it('создаёт 3 оффера', async () => {
    await createDemoProject('user-1')

    const calls = mockCreate.mock.calls
    const offerCalls = calls.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0]?.data?.headline !== undefined
    )
    expect(offerCalls).toHaveLength(3)
  })

  it('создаёт TestRun со статусом COMPLETED', async () => {
    await createDemoProject('user-1')

    const calls = mockCreate.mock.calls
    const testRunCalls = calls.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0]?.data?.status === 'COMPLETED' && call[0]?.data?.totalPairs === 12
    )
    expect(testRunCalls).toHaveLength(1)
    expect(testRunCalls[0][0].data.completedPairs).toBe(12)
    expect(testRunCalls[0][0].data.failedPairs).toBe(0)
  })

  it('создаёт 12 PersonaResponse (4 персоны × 3 оффера)', async () => {
    await createDemoProject('user-1')

    const calls = mockCreate.mock.calls
    const responseCalls = calls.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0]?.data?.testRunId !== undefined && call[0]?.data?.personaId !== undefined
    )
    expect(responseCalls).toHaveLength(12)
  })

  it('все PersonaResponse содержат обязательные поля', async () => {
    await createDemoProject('user-1')

    const calls = mockCreate.mock.calls
    const responseCalls = calls.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any) => call[0]?.data?.testRunId !== undefined && call[0]?.data?.decision !== undefined
    )

    for (const [arg] of responseCalls) {
      expect(arg.data).toHaveProperty('decision')
      expect(arg.data).toHaveProperty('confidence')
      expect(arg.data).toHaveProperty('perceivedValue')
      expect(arg.data).toHaveProperty('emotion')
      expect(arg.data).toHaveProperty('firstReaction')
      expect(arg.data).toHaveProperty('reasoning')
    }
  })
})
