interface WinnersTableProps {
  personas: Array<{ id: string; name: string }>
  offers: Array<{ id: string; headline: string }>
  responses: Array<{
    personaId: string
    offerId: string
    perceivedValue: number | null
    decision: string | null
  }>
}

export default function WinnersTable({ personas, offers, responses }: WinnersTableProps) {
  const winners = personas.map((p) => {
    const personaResps = responses.filter((r) => r.personaId === p.id && r.perceivedValue != null)
    if (personaResps.length === 0) return { persona: p, bestOffer: null, value: 0, decision: '' }

    const best = personaResps.reduce((a, b) =>
      (b.perceivedValue || 0) > (a.perceivedValue || 0) ? b : a
    )
    const offer = offers.find((o) => o.id === best.offerId)
    return {
      persona: p,
      bestOffer: offer,
      value: best.perceivedValue || 0,
      decision: best.decision || '',
    }
  })

  return (
    <div>
      <h3 className="mb-3 font-semibold">Лучший оффер для каждой персоны</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Персона</th>
              <th className="p-2 text-left">Лучший оффер</th>
              <th className="p-2 text-center">Ценность</th>
              <th className="p-2 text-center">Решение</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((w) => (
              <tr key={w.persona.id} className="border-b">
                <td className="p-2 font-medium">{w.persona.name}</td>
                <td className="p-2">{w.bestOffer?.headline || '—'}</td>
                <td className="p-2 text-center">{w.value.toFixed(1)}</td>
                <td className="p-2 text-center">{w.decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
