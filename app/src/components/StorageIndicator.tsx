import { HardDrive } from 'lucide-react'
import { formatBytes } from '../utils/format'

interface StorageIndicatorProps {
  used: number
  total: number
  showDetails?: boolean
}

export default function StorageIndicator({ used, total, showDetails = true }: StorageIndicatorProps) {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0
  const remaining = total - used

  const barColor =
    percentage > 80
      ? 'bg-red-500 dark:bg-red-500'
      : percentage > 60
      ? 'bg-amber-400 dark:bg-amber-500'
      : 'bg-slate-900 dark:bg-white'

  const pctColor =
    percentage > 80
      ? 'text-red-500 dark:text-red-400'
      : percentage > 60
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-slate-900 dark:text-white'

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
            <HardDrive size={17} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">Storage Usage</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Across all devices</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-semibold font-mono tabular-nums ${pctColor}`}>{percentage}%</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{formatBytes(remaining)} free</p>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(2, percentage)}%` }}
        />
      </div>

      {showDetails && (
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          {[
            { label: 'Used', value: formatBytes(used) },
            { label: 'Total', value: formatBytes(total) },
            { label: 'Remaining', value: formatBytes(remaining) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="text-xs font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
