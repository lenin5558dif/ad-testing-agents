import type { Insight } from '@/lib/analytics/insights'

interface InsightsProps {
  insights: Insight[]
}

const SEVERITY_STYLES = {
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-yellow-200 bg-yellow-50',
  success: 'border-green-200 bg-green-50',
}

export default function Insights({ insights }: InsightsProps) {
  if (insights.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 font-semibold">Инсайты</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${SEVERITY_STYLES[insight.severity]}`}
          >
            <h4 className="font-medium">{insight.title}</h4>
            <p className="mt-1 text-sm">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
