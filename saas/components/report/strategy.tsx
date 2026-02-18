import type { Insight } from '@/lib/analytics/insights'

interface StrategyProps {
  insights: Insight[]
}

export default function Strategy({ insights }: StrategyProps) {
  const universal = insights.filter((i) => i.type === 'universal')
  const polarizing = insights.filter((i) => i.type === 'polarizing')

  if (universal.length === 0 && polarizing.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 font-semibold">Стратегические рекомендации</h3>
      <div className="space-y-3">
        {universal.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="font-medium">Универсальные офферы</h4>
            <p className="mt-1 text-sm">
              Используйте для широких рекламных кампаний. Они работают на всю аудиторию.
            </p>
            <ul className="mt-2 list-inside list-disc text-sm">
              {universal.map((i, idx) => (
                <li key={idx}>{i.title}</li>
              ))}
            </ul>
          </div>
        )}
        {polarizing.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="font-medium">Поляризующие офферы</h4>
            <p className="mt-1 text-sm">
              Используйте для таргетированных кампаний на конкретные сегменты.
            </p>
            <ul className="mt-2 list-inside list-disc text-sm">
              {polarizing.map((i, idx) => (
                <li key={idx}>{i.title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
