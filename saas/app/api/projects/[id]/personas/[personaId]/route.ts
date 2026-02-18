import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { createPersonaSchema } from '@/lib/validation'

type Params = { params: Promise<{ id: string; personaId: string }> }

export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id, personaId } = await params
    await requireProjectAccess(id, session)

    const existing = await prisma.persona.findFirst({
      where: { id: personaId, projectId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Персона не найдена' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createPersonaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const persona = await prisma.persona.update({
      where: { id: personaId },
      data: parsed.data,
    })

    return NextResponse.json(persona)
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
    const { id, personaId } = await params
    await requireProjectAccess(id, session)

    const existing = await prisma.persona.findFirst({
      where: { id: personaId, projectId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Персона не найдена' }, { status: 404 })
    }

    await prisma.persona.delete({ where: { id: personaId } })
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
