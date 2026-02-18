interface HeatmapProps {
  personas: Array<{ id: string; name: string }>
  offers: Array<{ id: string; headline: string }>
  responses: Array<{
    personaId: string
    offerId: string
    perceivedValue: number | null
    decision: string | null
  }>
}

const DECISION_COLORS: Record<string, string> = {
  strong_yes: 'bg-green-600 text-white',
  maybe_yes: 'bg-green-200',
  neutral: 'bg-gray-200',
  probably_not: 'bg-red-200',
  strong_no: 'bg-red-500 text-white',
  not_for_me: 'bg-gray-400 text-white',
}

export default function Heatmap({ personas, offers, responses }: HeatmapProps) {
  const getResponse = (personaId: string, offerId: string) =>
    responses.find((r) => r.personaId === personaId && r.offerId === offerId)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border bg-white p-2 text-left">Персона</th>
            {offers.map((o) => (
              <th key={o.id} className="border p-2 text-center">
                {o.headline.length > 30 ? o.headline.slice(0, 30) + '...' : o.headline}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personas.map((p) => (
            <tr key={p.id}>
              <td className="sticky left-0 z-10 border bg-white p-2 font-medium">
                {p.name}
              </td>
              {offers.map((o) => {
                const resp = getResponse(p.id, o.id)
                const color = resp?.decision ? DECISION_COLORS[resp.decision] || 'bg-gray-100' : 'bg-gray-50'
                return (
                  <td
                    key={o.id}
                    className={`border p-2 text-center ${color}`}
                    title={`${resp?.decision || 'pending'} — ${resp?.perceivedValue?.toFixed(1) || 'N/A'}/10`}
                  >
                    {resp?.perceivedValue != null ? resp.perceivedValue.toFixed(1) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
