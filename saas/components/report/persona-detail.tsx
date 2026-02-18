'use client'

import { useState } from 'react'

interface PersonaDetailProps {
  persona: { id: string; name: string; description: string }
  responses: Array<{
    offerId: string
    offerHeadline: string
    decision: string | null
    confidence: number | null
    perceivedValue: number | null
    firstReaction: string | null
    reasoning: string | null
    objections: string[] | null
    whatWouldConvince: string | null
  }>
}

export default function PersonaDetail({ persona, responses }: PersonaDetailProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
      >
        <div>
          <h4 className="font-medium">{persona.name}</h4>
          <p className="text-sm text-gray-500">{persona.description}</p>
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t p-4">
          {responses.map((r) => (
            <div key={r.offerId} className="rounded border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{r.offerHeadline}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {r.decision} ({r.confidence?.toFixed(2) || 'N/A'})
                </span>
              </div>
              {r.firstReaction && (
                <p className="text-sm italic text-gray-600">&quot;{r.firstReaction}&quot;</p>
              )}
              {r.reasoning && <p className="mt-1 text-sm">{r.reasoning}</p>}
              {r.objections && r.objections.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-500">Возражения:</span>
                  <ul className="list-inside list-disc text-sm">
                    {r.objections.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {r.whatWouldConvince && (
                <p className="mt-1 text-xs text-gray-500">
                  Что убедит: {r.whatWouldConvince}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
