import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { checkTestLimit } from '@/lib/limits'
import { checkRateLimit, testLimiter } from '@/lib/rate-limit'
import { testQueue } from '@/lib/queue/test-queue'
import { EVAL_PROMPT_VERSION } from '@/lib/prompts/evaluation-prompt'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectAccess(id, session)

    const testRuns = await prisma.testRun.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalPairs: true,
        completedPairs: true,
        failedPairs: true,
        createdAt: true,
      },
    })

    return NextResponse.json(testRuns)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectAccess(id, session)

    // Rate limit
    const rl = await checkRateLimit(testLimiter, session.user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Подождите.', retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      )
    }

    // Проверка лимита подписки
    const limit = await checkTestLimit(session.user.id)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Лимит тестов за месяц исчерпан (${limit.used}/${limit.limit})` },
        { status: 403 }
      )
    }

    // Загрузить персон и офферы проекта
    const personas = await prisma.persona.findMany({ where: { projectId: id } })
    const offers = await prisma.offer.findMany({ where: { projectId: id } })

    if (personas.length === 0 || offers.length === 0) {
      return NextResponse.json(
        { error: 'Добавьте хотя бы одну персону и один оффер перед запуском теста' },
        { status: 400 }
      )
    }

    const totalPairs = personas.length * offers.length

    // Создать TestRun
    const testRun = await prisma.testRun.create({
      data: {
        projectId: id,
        status: 'PENDING',
        promptVersion: EVAL_PROMPT_VERSION,
        totalPairs,
      },
    })

    // Создать PersonaResponse для каждой пары и добавить в очередь
    for (const persona of personas) {
      for (const offer of offers) {
        const pr = await prisma.personaResponse.create({
          data: {
            testRunId: testRun.id,
            personaId: persona.id,
            offerId: offer.id,
            status: 'pending',
          },
        })

        await testQueue.add('evaluate', {
          personaResponseId: pr.id,
          testRunId: testRun.id,
        })
      }
    }

    // Обновить статус
    await prisma.testRun.update({
      where: { id: testRun.id },
      data: { status: 'RUNNING' },
    })

    return NextResponse.json({ testRunId: testRun.id }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
