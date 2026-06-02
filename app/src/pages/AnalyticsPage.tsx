import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { TrendingUp, Film, HardDrive, BarChart3, Activity, PieChart, Layers, Zap } from 'lucide-react'
import { getDevices, getClips, type Clip } from '../api/client'
import { formatBytes } from '../utils/format'
import { clipsByDay, clipsByHour, storageByDevice } from '../utils/analytics'
import ClipsBarChart from '../components/charts/ClipsBarChart'
import HourlyChart from '../components/charts/HourlyChart'
import StorageDonut from '../components/charts/StorageDonut'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import { Card } from '../components/ui'

function ChartCard({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {Icon && <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800"><Icon size={18} className="text-slate-600 dark:text-slate-400" /></div>}
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      </div>
      {children}
    </Card>
  )
}

export default function AnalyticsPage() {
  type ChartRange = 7 | 14 | 30
  const [range, setRange] = useState<ChartRange>(14)

  const { data: devicesRaw } = useQuery({ queryKey: ['devices'], queryFn: getDevices })
  const devices = devicesRaw ?? []

  // useQueries is the correct hook for a dynamic list of queries
  const clipsResults = useQueries({
    queries: devices.map(d => ({
      queryKey: ['clips', d.id],
      queryFn: () => getClips(d.id),
      enabled: !!d.id,
    })),
  })

  const isLoading = clipsResults.some(r => r.isLoading)
  const clipsByDevice: Clip[][] = clipsResults.map(r => r.data ?? [])
  const allClips: Clip[] = clipsByDevice.flat()

  const deviceNames = Object.fromEntries(devices.map(d => [d.id, d.name]))
  const chartData = clipsByDay(allClips, range)
  const hourlyData = clipsByHour(allClips)
  const donutData = storageByDevice(
    devices.map((d, i) => ({ deviceId: d.id, clips: clipsByDevice[i] ?? [] })),
    deviceNames
  )

  const totalClips = allClips.length
  const totalSize = allClips.reduce((s, c) => s + c.size, 0)
  const avgClipSize = totalClips ? Math.round(totalSize / totalClips) : 0
  const peakHour = hourlyData.reduce((max, h) => h.clips > max.clips ? h : max, hourlyData[0])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Analytics"
          subtitle={`${devices.length} device${devices.length !== 1 ? 's' : ''} • ${totalClips} clips`}
        />
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          label="Total clips" 
          value={totalClips}
          icon={<Film size={20} className="text-slate-600 dark:text-slate-400" />}
        />
        <StatCard 
          label="Storage used" 
          value={formatBytes(totalSize)}
          icon={<HardDrive size={20} className="text-slate-600 dark:text-slate-400" />}
        />
        <StatCard 
          label="Avg clip size" 
          value={formatBytes(avgClipSize)}
           icon={<BarChart3 size={20} className="text-slate-600 dark:text-slate-400" />}
        />
        <StatCard
          label="Peak activity"
          value={peakHour?.clips ? peakHour.hour : '—'}
          sub={peakHour?.clips ? `${peakHour.clips} clips` : 'No data'}
          icon={<Zap size={20} className="text-slate-600 dark:text-slate-400" />}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : totalClips === 0 ? (
        <EmptyState 
          icon={<BarChart3 size={24} />}
          title="No analytics yet"
          description="Analytics will appear once your devices start recording."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ChartCard title={`Clips recorded — last ${range} days`} icon={TrendingUp}>
            <ClipsBarChart data={chartData} height={200} />
          </ChartCard>

          <ChartCard title="Recording activity by hour" icon={Activity}>
            <HourlyChart data={hourlyData} height={200} />
          </ChartCard>

          {devices.length > 1 && (
            <ChartCard title="Storage by device" icon={PieChart}>
              <StorageDonut data={donutData} height={220} />
            </ChartCard>
          )}

          <ChartCard title="Device breakdown" icon={Layers}>
            <div className="space-y-4">
              {devices.map((d, i) => {
                const dClips = clipsByDevice[i] ?? []
                const dSize = dClips.reduce((s, c) => s + c.size, 0)
                const pct = totalSize ? Math.round((dSize / totalSize) * 100) : 0
                const colors = ['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500']
                return (
                  <div key={d.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                      <span className="text-slate-400 dark:text-slate-500">
                        {dClips.length} clips · {formatBytes(dSize)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line */}
                      <div
                        className={`h-full rounded-full transition-all ${colors[i % colors.length]}`}
                        style={{ width: `${pct || 1}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
