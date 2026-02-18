'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  niche: string
  personas: Array<{ id: string; name: string; description: string }>
  offers: Array<{ id: string; headline: string }>
  _count: { testRuns: number }
}

interface TestRun {
  id: string
  status: string
  totalPairs: number
  completedPairs: number
  failedPairs: number
  createdAt: string
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

export default function ProjectPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'personas' | 'offers' | 'tests'>('personas')
  const [startingTest, setStartingTest] = useState(false)
  const [testError, setTestError] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setProject(p)
        document.title = `${p.name} | AdTest`
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (tab === 'tests') {
      fetch(`/api/projects/${id}/test-runs`)
        .then((r) => r.json())
        .then(setTestRuns)
    }
  }, [id, tab])

  async function handleStartTest() {
    setStartingTest(true)
    setTestError('')
    const res = await fetch(`/api/projects/${id}/test-runs`, {
      method: 'POST',
    })
    setStartingTest(false)
    if (!res.ok) {
      const data = await res.json()
      setTestError(data.error || 'Ошибка запуска теста')
      return
    }
    const data = await res.json()
    router.push(`/dashboard/projects/${id}/test-runs/${data.testRunId}`)
  }

  if (loading) return <div className="text-gray-500">Загрузка...</div>
  if (!project) return <div className="text-red-600">Проект не найден</div>

  const canStartTest = project.personas.length > 0 && project.offers.length > 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{project.name}</h2>
          <p className="text-sm text-gray-500">{project.niche}</p>
        </div>
        <button
          onClick={handleStartTest}
          disabled={!canStartTest || startingTest}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          title={canStartTest ? 'Запустить тест' : 'Добавьте персоны и офферы'}
        >
          {startingTest ? 'Запуск...' : 'Запустить тест'}
        </button>
      </div>

      {testError && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{testError}</div>
      )}

      <div className="mb-4 flex gap-4 border-b">
        <button
          onClick={() => setTab('personas')}
          className={`border-b-2 px-4 py-2 text-sm ${
            tab === 'personas' ? 'border-black font-medium' : 'border-transparent text-gray-500'
          }`}
        >
          Персоны ({project.personas.length})
        </button>
        <button
          onClick={() => setTab('offers')}
          className={`border-b-2 px-4 py-2 text-sm ${
            tab === 'offers' ? 'border-black font-medium' : 'border-transparent text-gray-500'
          }`}
        >
          Офферы ({project.offers.length})
        </button>
        <button
          onClick={() => setTab('tests')}
          className={`border-b-2 px-4 py-2 text-sm ${
            tab === 'tests' ? 'border-black font-medium' : 'border-transparent text-gray-500'
          }`}
        >
          Тесты ({project._count.testRuns})
        </button>
        {tab !== 'tests' && (
          <Link
            href={`/dashboard/projects/${id}/${tab === 'personas' ? 'personas' : 'offers'}`}
            className="ml-auto rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
          >
            Управление
          </Link>
        )}
      </div>

      {tab === 'personas' && (
        <div>
          {project.personas.length === 0 ? (
            <p className="py-8 text-center text-gray-400">
              Нет персон. Перейдите в управление для создания.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {project.personas.map((p) => (
                <div key={p.id} className="rounded border p-3">
                  <h4 className="font-medium">{p.name}</h4>
                  <p className="text-sm text-gray-500">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'offers' && (
        <div>
          {project.offers.length === 0 ? (
            <p className="py-8 text-center text-gray-400">
              Нет офферов. Перейдите в управление для создания.
            </p>
          ) : (
            <div className="space-y-2">
              {project.offers.map((o) => (
                <div key={o.id} className="rounded border p-3">
                  <h4 className="font-medium">{o.headline}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'tests' && (
        <div>
          {testRuns.length === 0 ? (
            <p className="py-8 text-center text-gray-400">
              Нет тестов. Запустите первый тест.
            </p>
          ) : (
            <div className="space-y-3">
              {testRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/projects/${id}/test-runs/${run.id}`}
                  className="block rounded border p-4 hover:border-black"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">
                        {new Date(run.createdAt).toLocaleString('ru-RU')}
                      </span>
                      <span className={`ml-3 rounded px-2 py-0.5 text-xs font-medium ${statusBadge[run.status] || 'bg-gray-100'}`}>
                        {run.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {run.completedPairs}/{run.totalPairs} пар
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
