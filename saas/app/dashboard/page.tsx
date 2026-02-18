'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  niche: string
  isDemo: boolean
  createdAt: string
  _count: { personas: number; offers: number; testRuns: number }
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Проекты | AdTest'
    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-gray-500">Загрузка...</div>
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-2 text-xl font-semibold">Нет проектов</h2>
        <p className="mb-6 text-gray-500">
          Создайте первый проект для тестирования рекламных офферов
        </p>
        <Link
          href="/dashboard/projects/new"
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Создать проект
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Проекты</h2>
        <Link
          href="/dashboard/projects/new"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Новый проект
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className="rounded-lg border p-4 hover:border-black"
          >
            <h3 className="font-medium">
              {p.name} {p.isDemo && <span className="text-xs text-gray-400">(демо)</span>}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{p.niche}</p>
            <div className="mt-3 flex gap-4 text-xs text-gray-400">
              <span>{p._count.personas} персон</span>
              <span>{p._count.offers} офферов</span>
              <span>{p._count.testRuns} тестов</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
