import { describe, it, expect } from 'vitest'
import { generateInsights } from '@/lib/analytics/insights'

describe('generateInsights', () => {
  const personas = [
    { id: 'p1', name: 'Анна' },
    { id: 'p2', name: 'Борис' },
    { id: 'p3', name: 'Вера' },
  ]

  const offers = [
    { id: 'o1', headline: 'Скидка 50%', price: '3000' },
    { id: 'o2', headline: 'Премиум уход', price: '8000' },
  ]

  it('возвращает пустой массив без ответов', () => {
    const insights = generateInsights([], personas, offers)
    expect(insights).toEqual([])
  })

  it('обнаруживает поляризующий оффер', () => {
    const responses = [
      { personaId: 'p1', offerId: 'o1', decision: 'strong_yes', perceivedValue: 9, confidence: 0.9 },
      { personaId: 'p2', offerId: 'o1', decision: 'strong_no', perceivedValue: 2, confidence: 0.8 },
      { personaId: 'p3', offerId: 'o1', decision: 'neutral', perceivedValue: 5, confidence: 0.5 },
    ]

    const insights = generateInsights(responses, personas, offers)
    const polarizing = insights.filter((i) => i.type === 'polarizing')
    expect(polarizing.length).toBe(1)
    expect(polarizing[0].severity).toBe('warning')
  })

  it('обнаруживает стабильный оффер (min variance)', () => {
    const responses = [
      { personaId: 'p1', offerId: 'o1', decision: 'maybe_yes', perceivedValue: 7, confidence: 0.7 },
      { personaId: 'p2', offerId: 'o1', decision: 'maybe_yes', perceivedValue: 7.5, confidence: 0.7 },
      { personaId: 'p3', offerId: 'o1', decision: 'maybe_yes', perceivedValue: 6.5, confidence: 0.6 },
    ]

    const insights = generateInsights(responses, personas, offers)
    const stable = insights.filter((i) => i.type === 'stable')
    expect(stable.length).toBe(1)
  })

  it('обнаруживает универсальный оффер (все положительные)', () => {
    const responses = [
      { personaId: 'p1', offerId: 'o1', decision: 'strong_yes', perceivedValue: 9, confidence: 0.9 },
      { personaId: 'p2', offerId: 'o1', decision: 'maybe_yes', perceivedValue: 7, confidence: 0.7 },
      { personaId: 'p3', offerId: 'o1', decision: 'maybe_yes', perceivedValue: 7, confidence: 0.7 },
    ]

    const insights = generateInsights(responses, personas, offers)
    const universal = insights.filter((i) => i.type === 'universal')
    expect(universal.length).toBe(1)
    expect(universal[0].severity).toBe('success')
  })

  it('генерирует лучший оффер для каждой персоны', () => {
    const responses = [
      { personaId: 'p1', offerId: 'o1', decision: 'strong_yes', perceivedValue: 9, confidence: 0.9 },
      { personaId: 'p1', offerId: 'o2', decision: 'neutral', perceivedValue: 5, confidence: 0.5 },
      { personaId: 'p2', offerId: 'o1', decision: 'probably_not', perceivedValue: 3, confidence: 0.6 },
      { personaId: 'p2', offerId: 'o2', decision: 'strong_yes', perceivedValue: 8, confidence: 0.9 },
    ]

    const insights = generateInsights(responses, personas, offers)
    const best = insights.filter((i) => i.type === 'best_offer')
    expect(best.length).toBe(2)
  })

  it('генерирует среднюю ценность по офферам', () => {
    const responses = [
      { personaId: 'p1', offerId: 'o1', decision: 'maybe_yes', perceivedValue: 7, confidence: 0.7 },
      { personaId: 'p2', offerId: 'o1', decision: 'neutral', perceivedValue: 5, confidence: 0.5 },
      { personaId: 'p1', offerId: 'o2', decision: 'strong_yes', perceivedValue: 9, confidence: 0.9 },
      { personaId: 'p2', offerId: 'o2', decision: 'maybe_yes', perceivedValue: 8, confidence: 0.7 },
    ]

    const insights = generateInsights(responses, personas, offers)
    const avg = insights.filter((i) => i.type === 'avg_value')
    expect(avg.length).toBe(2)
  })
})
