import { PrismaClient } from '@prisma/client'
import { generateSystemPrompt } from '../lib/prompts/system-prompt'
import { generateEvaluationPrompt } from '../lib/prompts/evaluation-prompt'
import { callLLM } from '../lib/openrouter'
import { parseEvaluationResponse } from '../lib/ai/parse-response'

const prisma = new PrismaClient()

async function main() {
  const persona = await prisma.persona.findFirst()
  const offer = await prisma.offer.findFirst()

  if (!persona || !offer) {
    console.error('Нет персон или офферов в базе')
    process.exit(1)
  }

  console.log('=== ПЕРСОНА ===')
  console.log(`${persona.name} — ${persona.description}`)
  console.log(`Возраст: ${persona.ageGroup}, Доход: ${persona.incomeLevel}`)
  console.log(`Профессия: ${persona.occupation}`)
  console.log(`Черты: ${(persona.personalityTraits as string[]).join(', ')}`)
  console.log()

  console.log('=== ОФФЕР ===')
  console.log(`Заголовок: ${offer.headline}`)
  console.log(`Текст: ${offer.body}`)
  console.log(`CTA: ${offer.callToAction}`)
  console.log(`Цена: ${offer.price}`)
  console.log()

  const systemPrompt = generateSystemPrompt(persona)
  const evalPrompt = generateEvaluationPrompt(offer, persona)

  console.log('=== SYSTEM PROMPT (длина) ===')
  console.log(`${systemPrompt.length} символов`)
  console.log()

  console.log('=== EVALUATION PROMPT (длина) ===')
  console.log(`${evalPrompt.length} символов`)
  console.log()

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
  console.log(`Ответ получен за ${elapsed}ms`)
  console.log()

  console.log('=== RAW ОТВЕТ ===')
  console.log(raw)
  console.log()

  const parsed = parseEvaluationResponse(raw)
  if (parsed) {
    console.log('=== PARSED РЕЗУЛЬТАТ ===')
    console.log(JSON.stringify(parsed, null, 2))
  } else {
    console.error('ОШИБКА ПАРСИНГА — невалидный JSON')
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
