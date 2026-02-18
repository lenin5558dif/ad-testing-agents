import { describe, it, expect } from 'vitest'
import { parseEvaluationResponse } from '@/lib/ai/parse-response'

describe('parseEvaluationResponse', () => {
  const validResponse = {
    decision: 'maybe_yes',
    confidence: 0.7,
    perceivedValue: 6.5,
    emotion: 'interested',
    emotionIntensity: 0.6,
    firstReaction: 'Мне понравилось предложение',
    reasoning: 'Цена адекватная, но хочу больше деталей',
    objections: ['Нет отзывов', 'Далеко от дома'],
    whatWouldConvince: 'Фото результатов',
    valueAlignment: { качество: 0.8, цена: 0.6 },
  }

  it('парсит валидный JSON ответ', () => {
    const result = parseEvaluationResponse(JSON.stringify(validResponse))
    expect(result).not.toBeNull()
    expect(result!.decision).toBe('maybe_yes')
    expect(result!.confidence).toBe(0.7)
    expect(result!.objections).toEqual(['Нет отзывов', 'Далеко от дома'])
  })

  it('парсит ответ обёрнутый в ```json```', () => {
    const wrapped = '```json\n' + JSON.stringify(validResponse) + '\n```'
    const result = parseEvaluationResponse(wrapped)
    expect(result).not.toBeNull()
    expect(result!.decision).toBe('maybe_yes')
  })

  it('возвращает null для невалидного JSON', () => {
    const result = parseEvaluationResponse('это не JSON вообще')
    expect(result).toBeNull()
  })

  it('возвращает null для невалидного decision', () => {
    const bad = { ...validResponse, decision: 'absolutely' }
    const result = parseEvaluationResponse(JSON.stringify(bad))
    expect(result).toBeNull()
  })

  it('возвращает null если confidence > 1', () => {
    const bad = { ...validResponse, confidence: 1.5 }
    const result = parseEvaluationResponse(JSON.stringify(bad))
    expect(result).toBeNull()
  })

  it('возвращает null если confidence < 0', () => {
    const bad = { ...validResponse, confidence: -0.1 }
    const result = parseEvaluationResponse(JSON.stringify(bad))
    expect(result).toBeNull()
  })

  it('возвращает null если perceivedValue > 10', () => {
    const bad = { ...validResponse, perceivedValue: 11 }
    const result = parseEvaluationResponse(JSON.stringify(bad))
    expect(result).toBeNull()
  })

  it('возвращает null если objections не массив', () => {
    const bad = { ...validResponse, objections: 'not array' }
    const result = parseEvaluationResponse(JSON.stringify(bad))
    expect(result).toBeNull()
  })

  it('принимает граничные значения (0.0, 1.0, 10.0)', () => {
    const edge = {
      ...validResponse,
      confidence: 0,
      emotionIntensity: 1,
      perceivedValue: 10,
    }
    const result = parseEvaluationResponse(JSON.stringify(edge))
    expect(result).not.toBeNull()
  })

  it('принимает все валидные типы decision', () => {
    const decisions = ['strong_yes', 'maybe_yes', 'neutral', 'probably_not', 'strong_no', 'not_for_me']
    for (const d of decisions) {
      const resp = { ...validResponse, decision: d }
      const result = parseEvaluationResponse(JSON.stringify(resp))
      expect(result).not.toBeNull()
      expect(result!.decision).toBe(d)
    }
  })

  it('устанавливает whatWouldConvince в null если отсутствует', () => {
    const { whatWouldConvince, ...rest } = validResponse
    const result = parseEvaluationResponse(JSON.stringify(rest))
    expect(result).not.toBeNull()
    expect(result!.whatWouldConvince).toBeNull()
  })
})
