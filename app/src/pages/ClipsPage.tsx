import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { FileVideo, Download, CalendarDays, Search, X, Play, Film, Clock, HardDrive } from 'lucide-react'
import { getClips, streamUrl, type Clip } from '../api/client'
import { formatBytes, formatDuration } from '../utils/format'
import ClipThumbnail from '../components/ClipThumbnail'
import PullToRefreshIndicator from '../components/PullToRefreshIndicator'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

export default function ClipsPage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: clips, isLoading } = useQuery({
    queryKey: ['clips', deviceId],
    queryFn: () => getClips(deviceId!),
    enabled: !!deviceId,
  })

  const { refreshing, pullDistance, isTriggered, progress } = usePullToRefresh({
    onRefresh: () => queryClient.invalidateQueries({ queryKey: ['clips', deviceId] }),
  })

  const filtered = (clips ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  const byDate = filtered.reduce<Record<string, Clip[]>>((acc, clip) => {
    acc[clip.date] = [...(acc[clip.date] ?? []), clip]
    return acc
  }, {})

  const totalSize = clips?.reduce((s, c) => s + c.size, 0) ?? 0

  return (
    <div>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isTriggered={isTriggered}
        refreshing={refreshing}
        progress={progress}
      />

      <PageHeader
        title={deviceId?.replace(/-/g, ' ') ?? 'Clips'}
        subtitle={`${clips?.length ?? 0} clips · ${formatBytes(totalSize)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: deviceId?.replace(/-/g, ' ') ?? 'Clips' }
        ]}
        icon={<FileVideo size={24} />}
      />

      {/* Search bar */}
      {!isLoading && (clips?.length ?? 0) > 0 && (
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clips…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {search && (
            <button
              type="button"
              title="Clear search"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-14 bg-white dark:bg-slate-900 border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && clips?.length === 0 && (
        <EmptyState
          icon={<Film size={24} />}
          title="No clips recorded"
          description="This device hasn't recorded anything yet. Check back later."
        />
      )}

      {!isLoading && search && filtered.length === 0 && (
        <EmptyState
          icon={<Search size={24} />}
          title={`No results for "${search}"`}
          description="Try adjusting your search query."
          action={{
            label: 'Clear search',
            onClick: () => setSearch(''),
          }}
        />
      )}

      <div className="space-y-8">
        {Object.entries(byDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dateClips]) => (
            <div key={date}>
              <h2 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                <CalendarDays size={16} className="text-slate-600 dark:text-slate-400" />
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                })}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateClips.map(clip => (
                  <Link key={clip.id} to={`/devices/${deviceId}/clips/${clip.id}`}>
                    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 aspect-video overflow-hidden">
                        <ClipThumbnail
                          videoUrl={streamUrl(deviceId!, clip.id)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center shadow-xl scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200">
                            <Play size={22} className="text-slate-900 dark:text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                        {/* Duration badge */}
                        {clip.duration > 0 && (
                          <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium rounded-md">
                            <Clock size={9} />
                            {formatDuration(clip.duration)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                          {clip.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1"><HardDrive size={10} />{formatBytes(clip.size)}</span>
                        </div>
                      </div>

                      {/* Download — always visible */}
                      <div className="px-4 pb-4">
                        <a
                          href={streamUrl(deviceId!, clip.id)}
                          download={clip.name}
                          onClick={e => e.stopPropagation()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          <Download size={13} />
                          Download
                        </a>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
