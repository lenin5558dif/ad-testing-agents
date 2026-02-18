import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { testQueue } from '@/lib/queue/test-queue'
import { z } from 'zod'

const retrySchema = z.object({
  personaResponseId: z.string(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
    const session = await requireAuth()
    const { id, runId } = await params
    await requireProjectAccess(id, session)

    const body = await req.json()
    const parsed = retrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }

    const pr = await prisma.personaResponse.findUnique({
      where: { id: parsed.data.personaResponseId },
    })

    if (!pr || pr.testRunId !== runId) {
      return NextResponse.json({ error: 'PersonaResponse not found' }, { status: 404 })
    }

    // Сбросить статус и добавить в очередь
    await prisma.personaResponse.update({
      where: { id: pr.id },
      data: { status: 'pending', retryCount: { increment: 1 } },
    })

    // Скорректировать счётчики TestRun
    if (pr.status === 'failed') {
      await prisma.testRun.update({
        where: { id: runId },
        data: {
          failedPairs: { decrement: 1 },
          status: 'RUNNING',
        },
      })
    }

    await testQueue.add('evaluate', {
      personaResponseId: pr.id,
      testRunId: runId,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
