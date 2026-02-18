import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { checkOfferLimit } from '@/lib/limits'
import { generateOffers } from '@/lib/ai/generate-offers'
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

    const body = await req.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const offerAllowed = await checkOfferLimit(id, user.plan)
    if (!offerAllowed) {
      return NextResponse.json(
        { error: 'Лимит офферов для проекта достигнут' },
        { status: 403 }
      )
    }

    const offers = await generateOffers(project.niche, parsed.data.count)

    const created = await prisma.offer.createMany({
      data: offers.map((o) => ({
        ...o,
        projectId: project.id,
      })),
    })

    return NextResponse.json(
      { count: created.count, message: `Сгенерировано ${created.count} офферов` },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: 'Ошибка генерации офферов' },
      { status: 500 }
    )
  }
}
