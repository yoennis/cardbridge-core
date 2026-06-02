import { RefreshCw } from 'lucide-react'

interface Props {
  pullDistance: number
  isTriggered: boolean
  refreshing: boolean
  progress: number
}

export default function PullToRefreshIndicator({ pullDistance, isTriggered, refreshing, progress }: Props) {
  const visible = pullDistance > 8 || refreshing

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
    >
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-medium
        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
        text-slate-700 dark:text-slate-200 transition-all duration-150
        ${isTriggered || refreshing ? 'scale-100 opacity-100' : 'scale-90 opacity-70'}`}
      >
        <RefreshCw
          size={13}
          className={`text-brand-500 transition-transform duration-300 ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 360}deg)` }}
        />
        {refreshing ? 'Refreshing…' : isTriggered ? 'Release to refresh' : 'Pull to refresh'}
      </div>
    </div>
  )
}
