import { prisma } from '@/lib/db'
import { Project } from '@prisma/client'
import demoResults from '@/prisma/demo-results.json'

const DEMO_PERSONAS = [
  {
    name: 'Дима', description: 'Студент-экономист',
    ageGroup: '18-23', incomeLevel: 'low', occupation: 'Студент',
    personalityTraits: ['impulsive', 'optimistic'],
    values: ['экономия', 'скорость', 'тренды'],
    painPoints: ['мало денег', 'нет времени'],
    goals: ['успевать учиться и работать'],
    triggersPositive: 'Скидки, быстрый сервис, модное место',
    triggersNegative: 'Высокие цены, пафосная атмосфера',
    decisionFactors: ['цена', 'скорость', 'расположение'],
    backgroundStory: 'Студент 3 курса, подрабатывает курьером. Пьёт кофе каждый день, обычно самый дешёвый.',
  },
  {
    name: 'Алексей', description: 'Офисный работник-кофеман',
    ageGroup: '30-39', incomeLevel: 'high', occupation: 'IT-менеджер',
    personalityTraits: ['analytical', 'status_seeking'],
    values: ['качество', 'вкус', 'атмосфера'],
    painPoints: ['стресс на работе', 'скучные кофейни'],
    goals: ['найти идеальный кофе рядом с офисом'],
    triggersPositive: 'Специалитет, обжарка, лофт-атмосфера',
    triggersNegative: 'Массовые сети, растворимый кофе',
    decisionFactors: ['качество зёрен', 'атмосфера', 'рекомендации'],
    backgroundStory: 'Работает в IT, разбирается в кофе. Готов платить за качество. Ходит в кофейни 2 раза в день.',
  },
  {
    name: 'Марина', description: 'Мама в декрете',
    ageGroup: '30-39', incomeLevel: 'medium', occupation: 'В декрете',
    personalityTraits: ['practical', 'cautious'],
    values: ['семья', 'экономия', 'удобство'],
    painPoints: ['нет времени', 'ограниченный бюджет', 'некуда деть детей'],
    goals: ['выпить нормальный кофе хотя бы раз в день'],
    triggersPositive: 'Скидки, детское меню, быстрый заказ',
    triggersNegative: 'Дорого, нет места для коляски',
    decisionFactors: ['цена', 'удобство', 'детская зона'],
    backgroundStory: 'Мама троих детей. Живёт рядом с кофейней. Любит кофе, но редко может спокойно его выпить.',
  },
  {
    name: 'Виктор Петрович', description: 'Пенсионер-скептик',
    ageGroup: '55+', incomeLevel: 'low', occupation: 'Пенсионер',
    personalityTraits: ['skeptical', 'cautious'],
    values: ['традиции', 'честность', 'живое общение'],
    painPoints: ['одиночество', 'сложные технологии', 'маленькая пенсия'],
    goals: ['найти место для утренного кофе и общения'],
    triggersPositive: 'Живое общение, простота, рекомендации знакомых',
    triggersNegative: 'Приложения, QR-коды, английские слова',
    decisionFactors: ['цена', 'сервис', 'атмосфера', 'привычка'],
    backgroundStory: 'Пенсионер, бывший инженер. Пьёт кофе по утрам. Не доверяет новомодным трендам.',
  },
]

const DEMO_OFFERS = [
  { headline: 'Скидка 30% на весь кофе!', body: 'Первая неделя — скидка 30% на любой напиток.', callToAction: 'Попробовать', price: 'от 150 руб', strategyType: 'price' },
  { headline: 'Арабика из Эфиопии — ручная обжарка', body: 'Мы обжариваем зёрна сами. Specialty coffee от 92 баллов SCA.', callToAction: 'Попробовать', price: '350 руб', strategyType: 'quality' },
  { headline: 'Закажи заранее — забери без очереди', body: 'Скачай приложение, закажи кофе по дороге и забери готовый.', callToAction: 'Скачать', price: 'от 200 руб', strategyType: 'convenience' },
]

export async function createDemoProject(userId: string): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      userId,
      name: 'Кофейня (демо)',
      niche: 'Кофейня в центре города. Специальные сорта кофе, быстрый сервис, уютная атмосфера.',
      isDemo: true,
    },
  })

  // Создать персоны
  const personaIds: string[] = []
  for (const p of DEMO_PERSONAS) {
    const persona = await prisma.persona.create({
      data: { ...p, projectId: project.id },
    })
    personaIds.push(persona.id)
  }

  // Создать офферы
  const offerIds: string[] = []
  for (const o of DEMO_OFFERS) {
    const offer = await prisma.offer.create({
      data: { ...o, projectId: project.id },
    })
    offerIds.push(offer.id)
  }

  // Создать TestRun
  const testRun = await prisma.testRun.create({
    data: {
      projectId: project.id,
      status: 'COMPLETED',
      totalPairs: 12,
      completedPairs: 12,
      failedPairs: 0,
      promptVersion: 'demo',
    },
  })

  // Создать PersonaResponse из pre-recorded данных
  for (const result of demoResults) {
    await prisma.personaResponse.create({
      data: {
        testRunId: testRun.id,
        personaId: personaIds[result.personaIndex],
        offerId: offerIds[result.offerIndex],
        status: 'completed',
        decision: result.decision,
        confidence: result.confidence,
        perceivedValue: result.perceivedValue,
        emotion: result.emotion,
        emotionIntensity: result.emotionIntensity,
        firstReaction: result.firstReaction,
        reasoning: result.reasoning,
        objections: result.objections,
        whatWouldConvince: result.whatWouldConvince,
      },
    })
  }

  return project
}
