import { describe, it, expect } from 'vitest'
import { createProjectSchema, createOfferSchema, createPersonaSchema } from '@/lib/validation'

describe('createProjectSchema', () => {
  it('принимает валидный проект', () => {
    const result = createProjectSchema.safeParse({
      name: 'Тест',
      niche: 'Лазерная эпиляция',
    })
    expect(result.success).toBe(true)
  })

  it('отклоняет пустое имя', () => {
    const result = createProjectSchema.safeParse({
      name: '',
      niche: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет слишком длинное имя (>100)', () => {
    const result = createProjectSchema.safeParse({
      name: 'a'.repeat(101),
      niche: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет слишком длинную нишу (>500)', () => {
    const result = createProjectSchema.safeParse({
      name: 'test',
      niche: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('принимает граничные длины', () => {
    const result = createProjectSchema.safeParse({
      name: 'a'.repeat(100),
      niche: 'b'.repeat(500),
    })
    expect(result.success).toBe(true)
  })
})

describe('createOfferSchema', () => {
  it('принимает валидный оффер', () => {
    const result = createOfferSchema.safeParse({
      headline: 'Скидка 50%',
      body: 'Полное описание',
      callToAction: 'Записаться',
      price: '3000 руб',
      strategyType: 'price',
    })
    expect(result.success).toBe(true)
  })

  it('принимает минимальный оффер (только headline)', () => {
    const result = createOfferSchema.safeParse({
      headline: 'Тест',
    })
    expect(result.success).toBe(true)
  })

  it('отклоняет пустой headline', () => {
    const result = createOfferSchema.safeParse({
      headline: '',
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет слишком длинный body (>2000)', () => {
    const result = createOfferSchema.safeParse({
      headline: 'test',
      body: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

describe('createPersonaSchema', () => {
  const validPersona = {
    name: 'Анна',
    description: 'Менеджер среднего звена',
    ageGroup: '30-39' as const,
    incomeLevel: 'medium' as const,
    occupation: 'Менеджер',
    personalityTraits: ['прагматичная'],
    values: ['семья'],
    painPoints: ['нехватка времени'],
    goals: ['карьерный рост'],
    triggersPositive: 'Скидки и акции',
    triggersNegative: 'Навязчивая реклама',
    decisionFactors: ['цена'],
    backgroundStory: 'Живёт в Москве',
  }

  it('принимает валидную персону', () => {
    const result = createPersonaSchema.safeParse(validPersona)
    expect(result.success).toBe(true)
  })

  it('отклоняет невалидную возрастную группу', () => {
    const result = createPersonaSchema.safeParse({
      ...validPersona,
      ageGroup: '15-17',
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет невалидный уровень дохода', () => {
    const result = createPersonaSchema.safeParse({
      ...validPersona,
      incomeLevel: 'ultra',
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет пустой массив personalityTraits', () => {
    const result = createPersonaSchema.safeParse({
      ...validPersona,
      personalityTraits: [],
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет >5 элементов в массиве', () => {
    const result = createPersonaSchema.safeParse({
      ...validPersona,
      personalityTraits: ['a', 'b', 'c', 'd', 'e', 'f'],
    })
    expect(result.success).toBe(false)
  })
})
