import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { createPersonaSchema } from '@/lib/validation'
import { checkPersonaLimit } from '@/lib/limits'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectAccess(id, session)

    const personas = await prisma.persona.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(personas)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const allowed = await checkPersonaLimit(id, user.plan)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Лимит персон для проекта достигнут' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = createPersonaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const persona = await prisma.persona.create({
      data: {
        ...parsed.data,
        projectId: project.id,
      },
    })

    return NextResponse.json(persona, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
