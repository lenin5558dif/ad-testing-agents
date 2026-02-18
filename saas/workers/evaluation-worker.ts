import { Worker, Job } from 'bullmq'
import { redisConnection } from '@/lib/queue/connection'
import { EvaluationJobData } from '@/lib/queue/test-queue'
import { prisma } from '@/lib/db'
import { generateSystemPrompt } from '@/lib/prompts/system-prompt'
import { generateEvaluationPrompt } from '@/lib/prompts/evaluation-prompt'
import { callLLM } from '@/lib/openrouter'
import { parseEvaluationResponse } from '@/lib/ai/parse-response'
import pino from 'pino'

const logger = pino({ name: 'evaluation-worker' })

async function processEvaluation(job: Job<EvaluationJobData>) {
  const { personaResponseId, testRunId } = job.data

  const personaResponse = await prisma.personaResponse.findUnique({
    where: { id: personaResponseId },
    include: { persona: true, offer: true },
  })

  if (!personaResponse) {
    logger.error({ personaResponseId }, 'PersonaResponse not found')
    return
  }

  const { persona, offer } = personaResponse

  const systemPrompt = generateSystemPrompt(persona)
  const evaluationPrompt = generateEvaluationPrompt(offer, persona)

  let parsed = null
  let attempts = 0
  const maxParseRetries = 2

  while (!parsed && attempts <= maxParseRetries) {
    try {
      const userPrompt =
        attempts === 0
          ? evaluationPrompt
          : evaluationPrompt + '\n\nВАЖНО: верни ТОЛЬКО валидный JSON, без пояснений.'

      const raw = await callLLM({
        systemPrompt,
        userPrompt,
        model: 'google/gemini-3-flash-preview',
        temperature: 0.3,
        maxTokens: 4096,
      })

      parsed = parseEvaluationResponse(raw)
      if (!parsed) {
        logger.warn({ personaResponseId, attempt: attempts }, 'Invalid response, retrying')
      }
    } catch (error) {
      logger.error({ personaResponseId, attempt: attempts, error: String(error) }, 'LLM call failed')
    }
    attempts++
  }

  if (parsed) {
    // Успех
    await prisma.personaResponse.update({
      where: { id: personaResponseId },
      data: {
        status: 'completed',
        decision: parsed.decision,
        confidence: parsed.confidence,
        perceivedValue: parsed.perceivedValue,
        emotion: parsed.emotion,
        emotionIntensity: parsed.emotionIntensity,
        firstReaction: parsed.firstReaction,
        reasoning: parsed.reasoning,
        objections: parsed.objections,
        whatWouldConvince: parsed.whatWouldConvince,
        valueAlignment: parsed.valueAlignment,
      },
    })

    await prisma.testRun.update({
      where: { id: testRunId },
      data: { completedPairs: { increment: 1 } },
    })

    logger.info({ personaResponseId, decision: parsed.decision }, 'Evaluation completed')
  } else {
    // Провал после всех retry
    await prisma.personaResponse.update({
      where: { id: personaResponseId },
      data: { status: 'failed', retryCount: { increment: 1 } },
    })

    await prisma.testRun.update({
      where: { id: testRunId },
      data: { failedPairs: { increment: 1 } },
    })

    logger.error({ personaResponseId }, 'Evaluation failed after retries')
  }

  // Проверяем завершение всего TestRun
  const testRun = await prisma.testRun.findUnique({ where: { id: testRunId } })
  if (testRun && testRun.completedPairs + testRun.failedPairs >= testRun.totalPairs) {
    await prisma.testRun.update({
      where: { id: testRunId },
      data: { status: 'COMPLETED' },
    })
    logger.info({ testRunId }, 'TestRun completed')
  }
}

export function startWorker() {
  const worker = new Worker<EvaluationJobData>(
    'test-evaluation',
    processEvaluation,
    {
      connection: redisConnection,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job?.id }, 'Job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Job failed')
  })

  return worker
}

// Автозапуск при прямом вызове
if (require.main === module) {
  startWorker()
  logger.info('Evaluation worker started')
}
