export interface PersonaResponseData {
  decision: string
  confidence: number
  perceivedValue: number
  emotion: string
  emotionIntensity: number
  firstReaction: string
  reasoning: string
  objections: string[]
  whatWouldConvince: string | null
  valueAlignment: Record<string, number>
}

const VALID_DECISIONS = [
  'strong_yes',
  'maybe_yes',
  'neutral',
  'probably_not',
  'strong_no',
  'not_for_me',
]

export function parseEvaluationResponse(raw: string): PersonaResponseData | null {
  try {
    // 1. Убрать markdown code blocks
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    // 2. JSON.parse
    const data = JSON.parse(cleaned)

    // 3. Валидация полей
    if (!VALID_DECISIONS.includes(data.decision)) return null
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) return null
    if (typeof data.perceivedValue !== 'number' || data.perceivedValue < 0 || data.perceivedValue > 10) return null
    if (typeof data.emotion !== 'string' || !data.emotion) return null
    if (typeof data.emotionIntensity !== 'number' || data.emotionIntensity < 0 || data.emotionIntensity > 1) return null
    if (!Array.isArray(data.objections)) return null
    if (typeof data.firstReaction !== 'string') return null
    if (typeof data.reasoning !== 'string') return null

    return {
      decision: data.decision,
      confidence: data.confidence,
      perceivedValue: data.perceivedValue,
      emotion: data.emotion,
      emotionIntensity: data.emotionIntensity,
      firstReaction: data.firstReaction,
      reasoning: data.reasoning,
      objections: data.objections,
      whatWouldConvince: data.whatWouldConvince || null,
      valueAlignment: data.valueAlignment || {},
    }
  } catch {
    // Невалидный JSON
    return null
  }
}
