import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { checkPersonaGenLimit, checkPersonaLimit } from '@/lib/limits'
import { generatePersonas } from '@/lib/ai/generate-personas'
import { z } from 'zod'

const generateSchema = z.object({
  count: z.number().int().min(1).max(8),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const project = await requireProjectAccess(id, session)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Проверяем лимит генерации персон
    const genAllowed = await checkPersonaGenLimit(session.user.id, user.plan)
    if (!genAllowed) {
      return NextResponse.json(
        { error: 'Лимит генерации персон на сегодня исчерпан' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Проверяем лимит персон в проекте
    const personaAllowed = await checkPersonaLimit(id, user.plan)
    if (!personaAllowed) {
      return NextResponse.json(
        { error: 'Лимит персон для проекта достигнут' },
        { status: 403 }
      )
    }

    // Генерация через AI
    const personas = await generatePersonas(project.niche, parsed.data.count)

    // Сохранение в БД
    const created = await prisma.persona.createMany({
      data: personas.map((p) => ({
        ...p,
        projectId: project.id,
      })),
    })

    return NextResponse.json(
      { count: created.count, message: `Сгенерировано ${created.count} персон` },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: 'Ошибка генерации персон' },
      { status: 500 }
    )
  }
}
