import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { createOfferSchema } from '@/lib/validation'

type Params = { params: Promise<{ id: string; offerId: string }> }

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id, offerId } = await params
    await requireProjectAccess(id, session)

    const existing = await prisma.offer.findFirst({
      where: { id: offerId, projectId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Оффер не найден' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createOfferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: parsed.data,
    })

    return NextResponse.json(offer)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id, offerId } = await params
    await requireProjectAccess(id, session)

    const existing = await prisma.offer.findFirst({
      where: { id: offerId, projectId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Оффер не найден' }, { status: 404 })
    }

    await prisma.offer.delete({ where: { id: offerId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Невозможно удалить, используется в тестах' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
