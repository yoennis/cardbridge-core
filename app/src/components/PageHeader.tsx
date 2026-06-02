import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
  icon?: ReactNode
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  icon?: ReactNode
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, breadcrumbs, icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />}
              {crumb.href ? (
                <a href={crumb.href} className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
                  {crumb.icon}
                  {crumb.label}
                </a>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {crumb.icon}
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Title section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
