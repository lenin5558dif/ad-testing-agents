import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireProjectAccess, AuthError } from '@/lib/auth-guard'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
    const session = await requireAuth()
    const { id, runId } = await params
    await requireProjectAccess(id, session)

    const testRun = await prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        responses: {
          include: {
            persona: { select: { id: true, name: true } },
            offer: { select: { id: true, headline: true } },
          },
        },
      },
    })

    if (!testRun || testRun.projectId !== id) {
      return NextResponse.json({ error: 'TestRun not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: testRun.status,
      completedPairs: testRun.completedPairs,
      failedPairs: testRun.failedPairs,
      totalPairs: testRun.totalPairs,
      responses: testRun.responses,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
