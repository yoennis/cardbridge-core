import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

type AccentColor = 'blue' | 'violet' | 'amber' | 'emerald' | 'slate'

interface StatCardProps {
  label: string
  value: string | number
  change?: { value: number; isPositive: boolean }
  icon?: ReactNode
  iconColor?: string
  sub?: string
  accent?: AccentColor
}

const ACCENT: Record<AccentColor, { icon: string; bar: string; bg: string }> = {
  blue:    { icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',    bar: 'bg-blue-500',    bg: 'border-t-blue-500' },
  violet:  { icon: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', bar: 'bg-violet-500', bg: 'border-t-violet-500' },
  amber:   { icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',  bar: 'bg-amber-500',   bg: 'border-t-amber-500' },
  emerald: { icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', bg: 'border-t-emerald-500' },
  slate:   { icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',   bar: 'bg-slate-400',   bg: 'border-t-slate-300' },
}

export default function StatCard({ label, value, change, icon, iconColor, sub, accent = 'slate' }: StatCardProps) {
  const a = ACCENT[accent]
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-2 ${a.bg} rounded-xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        {icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconColor ?? a.icon}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mb-1">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white tracking-tight">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              change.isPositive
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            }`}>
              {change.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>

    </div>
  )
}
