import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Project } from '@prisma/client'

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new AuthError('Unauthorized', 401)
  }
  return session
}

export async function requireProjectAccess(
  projectId: string,
  session: Session
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new AuthError('Project not found', 404)
  }

  if (project.userId !== session.user.id) {
    throw new AuthError('Forbidden', 403)
  }

  return project
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'AuthError'
  }
}
