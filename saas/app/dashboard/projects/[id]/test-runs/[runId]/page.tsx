'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import ProgressBar from '@/components/report/progress-bar'
import Heatmap from '@/components/report/heatmap'
import WinnersTable from '@/components/report/winners-table'
import InsightsComponent from '@/components/report/insights'
import Strategy from '@/components/report/strategy'
import PersonaDetail from '@/components/report/persona-detail'
import FailedCard from '@/components/report/failed-card'
import { generateInsights } from '@/lib/analytics/insights'

interface Response {
  id: string
  personaId: string
  offerId: string
  status: string
  decision: string | null
  confidence: number | null
  perceivedValue: number | null
  emotion: string | null
  emotionIntensity: number | null
  firstReaction: string | null
  reasoning: string | null
  objections: string[] | null
  whatWouldConvince: string | null
  persona: { id: string; name: string }
  offer: { id: string; headline: string }
}

interface StatusData {
  status: string
  completedPairs: number
  failedPairs: number
  totalPairs: number
  responses: Response[]
}

export default function TestRunReportPage() {
  const { id: projectId, runId } = useParams()
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(() => {
    fetch(`/api/projects/${projectId}/test-runs/${runId}/status`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [projectId, runId])

  useEffect(() => {
    document.title = 'Отчёт по тесту | AdTest'
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      if (data?.status !== 'COMPLETED') {
        fetchStatus()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [fetchStatus, data?.status])

  if (loading || !data) return <div className="text-gray-500">Загрузка...</div>

  const personas = [...new Map(data.responses.map((r) => [r.persona.id, r.persona])).values()]
  const offers = [...new Map(data.responses.map((r) => [r.offer.id, r.offer])).values()]
  const completedResponses = data.responses.filter((r) => r.status === 'completed')
  const failedResponses = data.responses.filter((r) => r.status === 'failed')

  const insights = generateInsights(completedResponses, personas, offers)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Отчёт по тесту</h2>
        <p className="text-sm text-gray-500">Статус: {data.status}</p>
      </div>

      {data.status !== 'COMPLETED' && (
        <ProgressBar
          completed={data.completedPairs}
          failed={data.failedPairs}
          total={data.totalPairs}
        />
      )}

      {completedResponses.length > 0 && (
        <>
          <Heatmap
            personas={personas}
            offers={offers}
            responses={completedResponses}
          />

          <WinnersTable
            personas={personas}
            offers={offers}
            responses={completedResponses}
          />

          <InsightsComponent insights={insights.filter((i) => ['polarizing', 'stable', 'universal', 'avg_value'].includes(i.type))} />

          <Strategy insights={insights} />

          <div>
            <h3 className="mb-3 font-semibold">Детали по персонам</h3>
            <div className="space-y-3">
              {personas.map((p) => (
                <PersonaDetail
                  key={p.id}
                  persona={{ ...p, description: '' }}
                  responses={completedResponses
                    .filter((r) => r.personaId === p.id)
                    .map((r) => ({
                      offerId: r.offerId,
                      offerHeadline: r.offer.headline,
                      decision: r.decision,
                      confidence: r.confidence,
                      perceivedValue: r.perceivedValue,
                      firstReaction: r.firstReaction,
                      reasoning: r.reasoning,
                      objections: r.objections,
                      whatWouldConvince: r.whatWouldConvince,
                    }))}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {failedResponses.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-red-600">
            Ошибки ({failedResponses.length})
          </h3>
          <div className="space-y-2">
            {failedResponses.map((r) => (
              <FailedCard
                key={r.id}
                personaResponseId={r.id}
                personaName={r.persona.name}
                offerHeadline={r.offer.headline}
                projectId={projectId as string}
                testRunId={runId as string}
                onRetry={fetchStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
