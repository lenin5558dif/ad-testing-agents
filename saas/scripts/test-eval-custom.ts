import { PrismaClient } from '@prisma/client'
import { generateSystemPrompt } from '../lib/prompts/system-prompt'
import { generateEvaluationPrompt } from '../lib/prompts/evaluation-prompt'
import { callLLM } from '../lib/openrouter'
import { parseEvaluationResponse } from '../lib/ai/parse-response'

const prisma = new PrismaClient()

async function main() {
  const persona = await prisma.persona.findFirst()
  if (!persona) {
    console.error('Нет персон в базе')
    process.exit(1)
  }

  // Оффер, сделанный вручную под эту персону
  const customOffer = {
    id: 'test',
    projectId: persona.projectId,
    headline: 'Кофейня, где дизайнеры работают — а не ищут розетку',
    body: `12 рабочих мест с розетками у каждого. Тихая зона без звонков и встреч. Specialty-кофе 84+ SCA из Эфиопии и Колумбии — обжарка каждую пятницу. Интерьер от бюро LOFTO: бетон, дерево, 4-метровые окна — наши гости оставили 800+ фото в Instagram. По субботам — бесплатные воркшопы для дизайнеров и иллюстраторов. Мы не сеть. Нас открыли двое фрилансеров, которые устали от шума Starbucks.`,
    callToAction: 'Забронировать место у окна + капучино и круассан за 290₽',
    price: 'Кофе от 180₽, комбо кофе+десерт от 290₽',
    strategyType: 'quality',
    createdAt: new Date(),
  }

  console.log('=== ПЕРСОНА ===')
  console.log(`${persona.name} — ${persona.description}`)
  console.log(`Черты: ${(persona.personalityTraits as string[]).join(', ')}`)
  console.log(`Ценности: ${(persona.values as string[]).join(', ')}`)
  console.log(`Боли: ${(persona.painPoints as string[]).join(', ')}`)
  console.log(`Фильтры: ${(persona.decisionFactors as string[]).join(', ')}`)
  console.log()

  console.log('=== КАСТОМНЫЙ ОФФЕР ===')
  console.log(`Заголовок: ${customOffer.headline}`)
  console.log(`Текст: ${customOffer.body}`)
  console.log(`CTA: ${customOffer.callToAction}`)
  console.log(`Цена: ${customOffer.price}`)
  console.log()

  const systemPrompt = generateSystemPrompt(persona)
  const evalPrompt = generateEvaluationPrompt(customOffer as any, persona)

  console.log('=== ВЫЗОВ LLM... ===')
  const start = Date.now()

  const raw = await callLLM({
    systemPrompt,
    userPrompt: evalPrompt,
    model: 'google/gemini-3-flash-preview',
    temperature: 0.3,
    maxTokens: 4096,
  })

  const elapsed = Date.now() - start
  console.log(`Ответ за ${elapsed}ms`)
  console.log()

  console.log('=== RAW ОТВЕТ ===')
  console.log(raw)
  console.log()

  const parsed = parseEvaluationResponse(raw)
  if (parsed) {
    console.log('=== РЕЗУЛЬТАТ ===')
    console.log(`Эмоция: ${parsed.emotion} (${parsed.emotionIntensity})`)
    console.log(`Оценка: ${parsed.perceivedValue}/10`)
    console.log(`Решение: ${parsed.decision} (уверенность: ${parsed.confidence})`)
    console.log()
    console.log(`Первая реакция: ${parsed.firstReaction}`)
    console.log()
    console.log(`Анализ: ${parsed.reasoning}`)
    console.log()
    console.log(`Возражения: ${parsed.objections.length ? parsed.objections.join('\n  ') : 'нет'}`)
    console.log()
    console.log(`Что убедило бы: ${parsed.whatWouldConvince || '—'}`)
    console.log()
    console.log('Value alignment:', JSON.stringify(parsed.valueAlignment, null, 2))
  } else {
    console.error('ОШИБКА ПАРСИНГА')
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
