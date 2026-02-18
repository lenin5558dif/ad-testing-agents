'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PersonaCard from '@/components/persona-card'
import PersonaEditor from '@/components/persona-editor'

interface Persona {
  id: string
  name: string
  description: string
  ageGroup: string
  incomeLevel: string
  occupation: string
  personalityTraits: string[]
  values: string[]
  painPoints: string[]
  goals: string[]
  triggersPositive: string
  triggersNegative: string
  decisionFactors: string[]
  backgroundStory: string
}

export default function PersonasPage() {
  const { id: projectId } = useParams()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  function loadPersonas() {
    fetch(`/api/projects/${projectId}/personas`)
      .then((r) => r.json())
      .then(setPersonas)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = 'Персоны | AdTest'
    loadPersonas()
  }, [projectId])

  function handleEdit(persona: Persona) {
    setEditingPersona(persona)
    setShowEditor(true)
  }

  async function handleDelete(personaId: string) {
    if (!confirm('Удалить персону?')) return
    setDeleting(personaId)
    const res = await fetch(`/api/projects/${projectId}/personas/${personaId}`, {
      method: 'DELETE',
    })
    setDeleting(null)
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Ошибка удаления')
      return
    }
    loadPersonas()
  }

  function openNewEditor() {
    setEditingPersona(undefined)
    setShowEditor(true)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    const res = await fetch(`/api/projects/${projectId}/personas/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 4 }),
    })
    setGenerating(false)
    if (!res.ok) {
      const data = await res.json()
      setGenError(data.error || 'Ошибка генерации')
      return
    }
    loadPersonas()
  }

  if (loading) return <div className="text-gray-500">Загрузка...</div>

  return (
    <div>
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Назад к проекту
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Персоны</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded border border-black px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {generating ? 'Генерация...' : 'Сгенерировать через AI'}
          </button>
          <button
            onClick={openNewEditor}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Добавить персону
          </button>
        </div>
      </div>

      {genError && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{genError}</div>
      )}

      {personas.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">Нет персон</p>
          <p className="mt-1 text-sm text-gray-400">
            Добавьте персоны вручную или сгенерируйте через AI
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <div key={p.id} className={deleting === p.id ? 'pointer-events-none opacity-50' : ''}>
              <PersonaCard
                persona={p}
                onEdit={() => handleEdit(p)}
                onDelete={() => handleDelete(p.id)}
              />
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <PersonaEditor
          projectId={projectId as string}
          persona={editingPersona}
          onClose={() => {
            setShowEditor(false)
            setEditingPersona(undefined)
          }}
          onSave={() => {
            setShowEditor(false)
            setEditingPersona(undefined)
            loadPersonas()
          }}
        />
      )}
    </div>
  )
}
