'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import OfferCard from '@/components/offer-card'
import OfferEditor from '@/components/offer-editor'

interface Offer {
  id: string
  headline: string
  body?: string
  callToAction?: string
  price?: string
  strategyType?: string
}

export default function OffersPage() {
  const { id: projectId } = useParams()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  function loadOffers() {
    fetch(`/api/projects/${projectId}/offers`)
      .then((r) => r.json())
      .then(setOffers)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = 'Офферы | AdTest'
    loadOffers()
  }, [projectId])

  function handleEdit(offer: Offer) {
    setEditingOffer(offer)
    setShowEditor(true)
  }

  async function handleDelete(offerId: string) {
    if (!confirm('Удалить оффер?')) return
    setDeleting(offerId)
    const res = await fetch(`/api/projects/${projectId}/offers/${offerId}`, {
      method: 'DELETE',
    })
    setDeleting(null)
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Ошибка удаления')
      return
    }
    loadOffers()
  }

  function openNewEditor() {
    setEditingOffer(undefined)
    setShowEditor(true)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    const res = await fetch(`/api/projects/${projectId}/offers/generate`, {
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
    loadOffers()
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
        <h2 className="text-xl font-semibold">Офферы</h2>
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
            Добавить оффер
          </button>
        </div>
      </div>

      {genError && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{genError}</div>
      )}

      {offers.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">Нет офферов</p>
          <p className="mt-1 text-sm text-gray-400">
            Добавьте рекламные офферы для тестирования
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((o) => (
            <div key={o.id} className={deleting === o.id ? 'pointer-events-none opacity-50' : ''}>
              <OfferCard
                offer={o}
                onEdit={() => handleEdit(o)}
                onDelete={() => handleDelete(o.id)}
              />
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <OfferEditor
          projectId={projectId as string}
          offer={editingOffer}
          onClose={() => {
            setShowEditor(false)
            setEditingOffer(undefined)
          }}
          onSave={() => {
            setShowEditor(false)
            setEditingOffer(undefined)
            loadOffers()
          }}
        />
      )}
    </div>
  )
}
