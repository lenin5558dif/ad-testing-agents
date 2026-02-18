interface OfferCardProps {
  offer: {
    id: string
    headline: string
    body?: string
    callToAction?: string
    price?: string
    strategyType?: string
  }
  onEdit?: () => void
  onDelete?: () => void
}

export default function OfferCard({ offer, onEdit, onDelete }: OfferCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <h3 className="font-medium">{offer.headline}</h3>
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
      {offer.body && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{offer.body}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {offer.price && (
          <span className="rounded bg-green-50 px-2 py-0.5 text-green-700">{offer.price}</span>
        )}
        {offer.callToAction && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">{offer.callToAction}</span>
        )}
        {offer.strategyType && (
          <span className="rounded bg-gray-100 px-2 py-0.5">{offer.strategyType}</span>
        )}
      </div>
    </div>
  )
}
