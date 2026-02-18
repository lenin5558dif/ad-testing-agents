export interface Insight {
  type: 'polarizing' | 'stable' | 'universal' | 'segment' | 'price' | 'best_offer' | 'avg_value'
  title: string
  description: string
  severity: 'info' | 'warning' | 'success'
  data?: Record<string, unknown>
}

interface ResponseData {
  personaId: string
  offerId: string
  decision: string | null
  perceivedValue: number | null
  confidence: number | null
}

interface PersonaData {
  id: string
  name: string
}

interface OfferData {
  id: string
  headline: string
  price?: string | null
}

const DECISION_SCORES: Record<string, number> = {
  strong_yes: 5,
  maybe_yes: 4,
  neutral: 3,
  probably_not: 2,
  strong_no: 1,
  not_for_me: 0,
}

export function generateInsights(
  responses: ResponseData[],
  personas: PersonaData[],
  offers: OfferData[]
): Insight[] {
  const insights: Insight[] = []

  if (responses.length === 0) return insights

  // Группировка ответов по офферам
  const byOffer = new Map<string, ResponseData[]>()
  for (const r of responses) {
    const arr = byOffer.get(r.offerId) || []
    arr.push(r)
    byOffer.set(r.offerId, arr)
  }

  // 1. Поляризующие офферы
  for (const [offerId, resps] of byOffer) {
    const strongYes = resps.filter((r) => r.decision === 'strong_yes').length
    const strongNo = resps.filter((r) => r.decision === 'strong_no' || r.decision === 'not_for_me').length
    if (strongYes > 0 && strongNo > 0) {
      const offer = offers.find((o) => o.id === offerId)
      insights.push({
        type: 'polarizing',
        title: `Поляризующий оффер: ${offer?.headline || offerId}`,
        description: `${strongYes} сильно "за" и ${strongNo} сильно "против". Этот оффер вызывает противоречивые реакции.`,
        severity: 'warning',
        data: { offerId, strongYes, strongNo },
      })
    }
  }

  // 2. Стабильные офферы (min variance)
  const offerVariances: Array<{ offerId: string; variance: number }> = []
  for (const [offerId, resps] of byOffer) {
    const values = resps.map((r) => r.perceivedValue).filter((v): v is number => v !== null)
    if (values.length >= 2) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
      offerVariances.push({ offerId, variance })
    }
  }

  if (offerVariances.length > 0) {
    offerVariances.sort((a, b) => a.variance - b.variance)
    const most = offerVariances[0]
    const offer = offers.find((o) => o.id === most.offerId)
    insights.push({
      type: 'stable',
      title: `Самый стабильный оффер: ${offer?.headline || most.offerId}`,
      description: `Наименьший разброс в оценках (variance: ${most.variance.toFixed(2)}). Предсказуемая реакция аудитории.`,
      severity: 'info',
      data: { offerId: most.offerId, variance: most.variance },
    })
  }

  // 3. Универсальные офферы (все maybe_yes или выше)
  for (const [offerId, resps] of byOffer) {
    const allPositive = resps.every((r) =>
      r.decision && ['strong_yes', 'maybe_yes'].includes(r.decision)
    )
    if (allPositive && resps.length >= 2) {
      const offer = offers.find((o) => o.id === offerId)
      insights.push({
        type: 'universal',
        title: `Универсальный оффер: ${offer?.headline || offerId}`,
        description: `Все персоны реагируют положительно. Подходит для широкой аудитории.`,
        severity: 'success',
        data: { offerId },
      })
    }
  }

  // 6. Лучший оффер для каждой персоны
  const byPersona = new Map<string, ResponseData[]>()
  for (const r of responses) {
    const arr = byPersona.get(r.personaId) || []
    arr.push(r)
    byPersona.set(r.personaId, arr)
  }

  for (const [personaId, resps] of byPersona) {
    const best = resps.reduce((a, b) => {
      const scoreA = DECISION_SCORES[a.decision || ''] ?? 0
      const scoreB = DECISION_SCORES[b.decision || ''] ?? 0
      return scoreB > scoreA ? b : a
    })
    const persona = personas.find((p) => p.id === personaId)
    const offer = offers.find((o) => o.id === best.offerId)
    insights.push({
      type: 'best_offer',
      title: `Лучший оффер для ${persona?.name || personaId}`,
      description: `"${offer?.headline || best.offerId}" — решение: ${best.decision}, ценность: ${best.perceivedValue?.toFixed(1) || 'N/A'}`,
      severity: 'info',
      data: { personaId, offerId: best.offerId, decision: best.decision },
    })
  }

  // 7. Средний value по каждому офферу
  for (const [offerId, resps] of byOffer) {
    const values = resps.map((r) => r.perceivedValue).filter((v): v is number => v !== null)
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const offer = offers.find((o) => o.id === offerId)
      insights.push({
        type: 'avg_value',
        title: `Средняя ценность: ${offer?.headline || offerId}`,
        description: `Средняя воспринимаемая ценность: ${avg.toFixed(1)}/10`,
        severity: avg >= 6 ? 'success' : avg >= 4 ? 'info' : 'warning',
        data: { offerId, avgValue: avg },
      })
    }
  }

  return insights
}
