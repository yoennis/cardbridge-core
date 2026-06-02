export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
      <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <div className="space-y-4">
        <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="w-4/5 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2 mb-6">
        <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="w-64 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map(i => <StatCardSkeleton key={i} />)}
      </div>

      {/* Devices section skeleton */}
      <div>
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}
