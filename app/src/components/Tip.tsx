import { AlertCircle, Lightbulb, TrendingUp } from 'lucide-react'

interface TipProps {
  type: 'tip' | 'warning' | 'success'
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

const variants = {
  tip: {
    icon: 'text-slate-500 dark:text-slate-400',
    title: 'text-slate-900 dark:text-slate-100',
    desc: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  warning: {
    icon: 'text-amber-500 dark:text-amber-400',
    title: 'text-slate-900 dark:text-slate-100',
    desc: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-amber-400 dark:bg-amber-500',
  },
  success: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    title: 'text-slate-900 dark:text-slate-100',
    desc: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-emerald-400 dark:bg-emerald-500',
  },
}

const icons = {
  tip: Lightbulb,
  warning: AlertCircle,
  success: TrendingUp,
}

export default function Tip({ type, title, description, action }: TipProps) {
  const v = variants[type]
  const Icon = icons[type]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3">
      <Icon size={16} className={`${v.icon} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <h4 className={`${v.title} font-medium text-sm mb-1`}>{title}</h4>
        <p className={`${v.desc} text-xs leading-relaxed`}>{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  )
}
