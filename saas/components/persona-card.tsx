interface PersonaCardProps {
  persona: {
    id: string
    name: string
    description: string
    ageGroup: string
    incomeLevel: string
    occupation: string
  }
  onEdit?: () => void
  onDelete?: () => void
}

export default function PersonaCard({ persona, onEdit, onDelete }: PersonaCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <h3 className="font-medium">{persona.name}</h3>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Редактировать"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Удалить"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">{persona.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-gray-100 px-2 py-0.5">{persona.ageGroup}</span>
        <span className="rounded bg-gray-100 px-2 py-0.5">{persona.incomeLevel}</span>
        <span className="rounded bg-gray-100 px-2 py-0.5">{persona.occupation}</span>
      </div>
    </div>
  )
}
