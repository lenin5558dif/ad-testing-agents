'use client'

import { useState } from 'react'

interface Offer {
  id: string
  headline: string
  body?: string
  callToAction?: string
  price?: string
  strategyType?: string
}

interface OfferEditorProps {
  projectId: string
  offer?: Offer
  onClose: () => void
  onSave: () => void
}

export default function OfferEditor({ projectId, offer, onClose, onSave }: OfferEditorProps) {
  const isEditing = !!offer

  const [headline, setHeadline] = useState(offer?.headline ?? '')
  const [body, setBody] = useState(offer?.body ?? '')
  const [callToAction, setCallToAction] = useState(offer?.callToAction ?? '')
  const [price, setPrice] = useState(offer?.price ?? '')
  const [strategyType, setStrategyType] = useState(offer?.strategyType ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      headline,
      body: body || undefined,
      callToAction: callToAction || undefined,
      price: price || undefined,
      strategyType: strategyType || undefined,
    }

    const url = isEditing
      ? `/api/projects/${projectId}/offers/${offer.id}`
      : `/api/projects/${projectId}/offers`

    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Ошибка сохранения оффера')
      setLoading(false)
      return
    }

    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {isEditing ? 'Редактирование оффера' : 'Новый оффер'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>
          )}

          <input
            placeholder="Заголовок"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            required
            maxLength={200}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Текст оффера"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={4}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <input
            placeholder="Призыв к действию"
            value={callToAction}
            onChange={(e) => setCallToAction(e.target.value)}
            maxLength={200}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Цена"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              maxLength={50}
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              placeholder="Тип стратегии"
              value={strategyType}
              onChange={(e) => setStrategyType(e.target.value)}
              maxLength={100}
              className="rounded border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded bg-black py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
