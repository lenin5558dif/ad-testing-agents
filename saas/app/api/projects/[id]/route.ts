import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'
import { createProjectSchema } from '@/lib/validation'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const project = await requireProjectAccess(id, session)

    const full = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        personas: { orderBy: { createdAt: 'desc' } },
        offers: { orderBy: { createdAt: 'desc' } },
        _count: { select: { testRuns: true } },
      },
    })

    return NextResponse.json(full)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectAccess(id, session)

    const body = await req.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.project.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectAccess(id, session)

    await prisma.project.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
