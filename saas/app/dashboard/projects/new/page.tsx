'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()

  useEffect(() => {
    document.title = 'Новый проект | AdTest'
  }, [])

  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, niche }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Ошибка создания проекта')
      setLoading(false)
      return
    }

    const project = await res.json()
    router.push(`/dashboard/projects/${project.id}`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-xl font-semibold">Новый проект</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Название проекта
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Лазерная эпиляция Москва"
          />
        </div>

        <div>
          <label htmlFor="niche" className="block text-sm font-medium">
            Описание ниши
          </label>
          <textarea
            id="niche"
            required
            maxLength={500}
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Салон лазерной эпиляции в Москве. Целевая аудитория: женщины 25-45 лет..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Создание...' : 'Создать проект'}
        </button>
      </form>
    </div>
  )
}
