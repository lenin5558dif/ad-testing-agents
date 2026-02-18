'use client'

import { useState } from 'react'

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

interface PersonaEditorProps {
  projectId: string
  persona?: Persona
  onClose: () => void
  onSave: () => void
}

export default function PersonaEditor({ projectId, persona, onClose, onSave }: PersonaEditorProps) {
  const isEditing = !!persona

  const [name, setName] = useState(persona?.name ?? '')
  const [description, setDescription] = useState(persona?.description ?? '')
  const [ageGroup, setAgeGroup] = useState(persona?.ageGroup ?? '30-39')
  const [incomeLevel, setIncomeLevel] = useState(persona?.incomeLevel ?? 'medium')
  const [occupation, setOccupation] = useState(persona?.occupation ?? '')
  const [personalityTraits, setPersonalityTraits] = useState(persona?.personalityTraits?.join(', ') ?? '')
  const [values, setValues] = useState(persona?.values?.join(', ') ?? '')
  const [painPoints, setPainPoints] = useState(persona?.painPoints?.join(', ') ?? '')
  const [goals, setGoals] = useState(persona?.goals?.join(', ') ?? '')
  const [triggersPositive, setTriggersPositive] = useState(persona?.triggersPositive ?? '')
  const [triggersNegative, setTriggersNegative] = useState(persona?.triggersNegative ?? '')
  const [decisionFactors, setDecisionFactors] = useState(persona?.decisionFactors?.join(', ') ?? '')
  const [backgroundStory, setBackgroundStory] = useState(persona?.backgroundStory ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const splitComma = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean)

    const payload = {
      name,
      description,
      ageGroup,
      incomeLevel,
      occupation,
      personalityTraits: splitComma(personalityTraits),
      values: splitComma(values),
      painPoints: splitComma(painPoints),
      goals: splitComma(goals),
      triggersPositive,
      triggersNegative,
      decisionFactors: splitComma(decisionFactors),
      backgroundStory,
    }

    const url = isEditing
      ? `/api/projects/${projectId}/personas/${persona.id}`
      : `/api/projects/${projectId}/personas`

    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Ошибка сохранения персоны')
      setLoading(false)
      return
    }

    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {isEditing ? 'Редактирование персоны' : 'Новая персона'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>
          )}

          <input
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <input
            placeholder="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="block w-full rounded border px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="rounded border px-3 py-2 text-sm"
            >
              <option value="18-23">18-23</option>
              <option value="24-29">24-29</option>
              <option value="30-39">30-39</option>
              <option value="40-54">40-54</option>
              <option value="55+">55+</option>
            </select>
            <select
              value={incomeLevel}
              onChange={(e) => setIncomeLevel(e.target.value)}
              className="rounded border px-3 py-2 text-sm"
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="luxury">Премиум</option>
            </select>
          </div>

          <input
            placeholder="Профессия"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            required
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <input
            placeholder="Черты характера (через запятую)"
            value={personalityTraits}
            onChange={(e) => setPersonalityTraits(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <input
            placeholder="Ценности (через запятую)"
            value={values}
            onChange={(e) => setValues(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <input
            placeholder="Боли (через запятую)"
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <input
            placeholder="Цели (через запятую)"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Позитивные триггеры"
            value={triggersPositive}
            onChange={(e) => setTriggersPositive(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
            rows={2}
          />
          <textarea
            placeholder="Негативные триггеры"
            value={triggersNegative}
            onChange={(e) => setTriggersNegative(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
            rows={2}
          />
          <input
            placeholder="Факторы решения (через запятую)"
            value={decisionFactors}
            onChange={(e) => setDecisionFactors(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Предыстория"
            value={backgroundStory}
            onChange={(e) => setBackgroundStory(e.target.value)}
            className="block w-full rounded border px-3 py-2 text-sm"
            rows={3}
          />

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
