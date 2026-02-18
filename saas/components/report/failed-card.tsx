'use client'

interface FailedCardProps {
  personaResponseId: string
  personaName: string
  offerHeadline: string
  projectId: string
  testRunId: string
  onRetry: () => void
}

export default function FailedCard({
  personaResponseId,
  personaName,
  offerHeadline,
  projectId,
  testRunId,
  onRetry,
}: FailedCardProps) {
  async function handleRetry() {
    await fetch(`/api/projects/${projectId}/test-runs/${testRunId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaResponseId }),
    })
    onRetry()
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
      <div>
        <p className="text-sm font-medium">{personaName} × {offerHeadline}</p>
        <p className="text-xs text-red-600">Ошибка оценки</p>
      </div>
      <button
        onClick={handleRetry}
        className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
      >
        Повторить
      </button>
    </div>
  )
}
