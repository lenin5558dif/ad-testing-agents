interface ProgressBarProps {
  completed: number
  failed: number
  total: number
}

export default function ProgressBar({ completed, failed, total }: ProgressBarProps) {
  const pct = total > 0 ? ((completed + failed) / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Прогресс: {completed + failed}/{total}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-gray-200">
        <div
          className="h-full bg-black transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {failed > 0 && (
        <p className="text-xs text-red-500">{failed} ошибок</p>
      )}
    </div>
  )
}
