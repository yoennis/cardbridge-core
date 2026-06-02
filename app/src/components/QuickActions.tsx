import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface QuickAction {
  label: string
  description: string
  icon: ReactNode
  href: string
  color?: 'blue' | 'emerald' | 'amber' | 'purple'
}

interface QuickActionsProps {
  actions: QuickAction[]
  title?: string
}

export default function QuickActions({ actions, title = 'Quick Actions' }: QuickActionsProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map(action => (
          <Link
            key={action.label}
            to={action.href}
            className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900
              hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60
              p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                  bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
                  group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors mb-3">
                  {action.icon}
                </div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white">{action.label}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{action.description}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
