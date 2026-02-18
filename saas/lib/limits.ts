import { Plan } from '@prisma/client'
import { prisma } from '@/lib/db'

const PLAN_LIMITS = {
  FREE: { testsPerMonth: 5, personasPerProject: 8, offersPerProject: 5, personaGenPerDay: 3 },
  PRO: { testsPerMonth: 50, personasPerProject: 20, offersPerProject: 20, personaGenPerDay: 20 },
  AGENCY: { testsPerMonth: Infinity, personasPerProject: 50, offersPerProject: 50, personaGenPerDay: Infinity },
}

export async function checkTestLimit(
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { allowed: false, used: 0, limit: 0 }

  const limits = PLAN_LIMITS[user.plan]
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const used = await prisma.testRun.count({
    where: {
      project: { userId },
      createdAt: { gte: startOfMonth },
    },
  })

  return {
    allowed: used < limits.testsPerMonth,
    used,
    limit: limits.testsPerMonth,
  }
}

export async function checkPersonaLimit(
  projectId: string,
  plan: Plan
): Promise<boolean> {
  const limits = PLAN_LIMITS[plan]
  const count = await prisma.persona.count({
    where: { projectId },
  })
  return count < limits.personasPerProject
}

export async function checkOfferLimit(
  projectId: string,
  plan: Plan
): Promise<boolean> {
  const limits = PLAN_LIMITS[plan]
  const count = await prisma.offer.count({
    where: { projectId },
  })
  return count < limits.offersPerProject
}

export async function checkPersonaGenLimit(
  userId: string,
  plan: Plan
): Promise<boolean> {
  // Free: 3 генерации/день, Pro: 20/день, Agency: unlimited
  const limits = PLAN_LIMITS[plan]
  if (limits.personaGenPerDay === Infinity) return true

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  // Считаем персоны, созданные сегодня пользователем (исключая демо-проекты)
  const count = await prisma.persona.count({
    where: {
      project: {
        userId,
        isDemo: false,
      },
      createdAt: { gte: startOfDay },
    },
  })

  return count < limits.personaGenPerDay
}
