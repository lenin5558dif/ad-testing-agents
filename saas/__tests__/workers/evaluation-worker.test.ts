import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mocks
const { mockCallLLM } = vi.hoisted(() => ({
  mockCallLLM: vi.fn(),
}))

// Mock all external dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    personaResponse: { findUnique: vi.fn(), update: vi.fn() },
    testRun: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/openrouter', () => ({
  callLLM: mockCallLLM,
}))

vi.mock('@/lib/queue/connection', () => ({
  redisConnection: {},
}))

vi.mock('bullmq', () => {
  class MockWorker {
    constructor() {}
    on = vi.fn()
  }
  class MockQueue {
    constructor() {}
    add = vi.fn()
  }
  return { Worker: MockWorker, Queue: MockQueue }
})

vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { prisma } from '@/lib/db'
import { parseEvaluationResponse } from '@/lib/ai/parse-response'

const mockFindPR = vi.mocked(prisma.personaResponse.findUnique)
const mockUpdatePR = vi.mocked(prisma.personaResponse.update)
const mockFindTR = vi.mocked(prisma.testRun.findUnique)
const mockUpdateTR = vi.mocked(prisma.testRun.update)

describe('evaluation-worker logic', () => {
  const validAIResponse = JSON.stringify({
    decision: 'maybe_yes',
    confidence: 0.7,
    perceivedValue: 6.5,
    emotion: 'interested',
    emotionIntensity: 0.6,
    firstReaction: 'Мне понравилось',
    reasoning: 'Цена адекватная',
    objections: ['Нет отзывов'],
    whatWouldConvince: 'Фото результатов',
    valueAlignment: { качество: 0.8 },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parseEvaluationResponse парсит валидный ответ AI', () => {
    const result = parseEvaluationResponse(validAIResponse)
    expect(result).not.toBeNull()
    expect(result!.decision).toBe('maybe_yes')
    expect(result!.confidence).toBe(0.7)
  })

  it('parseEvaluationResponse возвращает null для невалидного ответа', () => {
    const result = parseEvaluationResponse('just text, not json')
    expect(result).toBeNull()
  })

  it('parseEvaluationResponse обрабатывает markdown-обёрнутый JSON', () => {
    const wrapped = '```json\n' + validAIResponse + '\n```'
    const result = parseEvaluationResponse(wrapped)
    expect(result).not.toBeNull()
    expect(result!.decision).toBe('maybe_yes')
  })

  it('parseEvaluationResponse отклоняет ответ с невалидным decision', () => {
    const bad = JSON.stringify({ ...JSON.parse(validAIResponse), decision: 'invalid' })
    const result = parseEvaluationResponse(bad)
    expect(result).toBeNull()
  })
})
