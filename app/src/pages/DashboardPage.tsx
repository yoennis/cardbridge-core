import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Camera, Plane, Film, HardDrive, Settings, Clock, ArrowRight, Activity, BarChart3 } from 'lucide-react'
import { getDevices, getClips, getDeviceInfo, streamUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatBytes, formatDuration } from '../utils/format'
import { clipsByDay, totalClipsToday, lastClipTime } from '../utils/analytics'
import ClipsBarChart from '../components/charts/ClipsBarChart'
import ClipThumbnail from '../components/ClipThumbnail'
import PullToRefreshIndicator from '../components/PullToRefreshIndicator'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import ServerOffline from '../components/ServerOffline'
import { Button } from '../components/ui'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import QuickStart from '../components/QuickStart'
import Tip from '../components/Tip'
import StorageIndicator from '../components/StorageIndicator'
import QuickActions from '../components/QuickActions'

// ─── Multi-device dashboard ───────────────────────────────────────────────────
function MultiDeviceDashboard() {
  const { user } = useAuth()
  const { data: devices, isLoading, error, refetch } = useQuery({ queryKey: ['devices'], queryFn: getDevices })

  const totalClips = devices?.reduce((s, d) => s + d.clipCount, 0) ?? 0
  const totalSize = devices?.reduce((s, d) => s + d.totalSize, 0) ?? 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(' ')[0]}`}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        action={
          <Link to="/devices/add">
            <Button icon={<Plus size={16} />}>Add Device</Button>
          </Link>
        }
      />

      {/* Empty state with onboarding */}
      {!isLoading && !error && devices?.length === 0 && (
        <>
          <QuickStart />
          <div className="space-y-4">
            <Tip 
              type="tip" 
              title="What is CardBridge?" 
              description="CardBridge is a wireless bridge for any SD-based recording device. Connect dashcams, drones, action cameras, and more to sync and manage footage automatically."
            />
          </div>
        </>
      )}

      {/* Dashboard when devices exist */}
      {!!devices?.length && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="Connected Devices"
              value={devices?.length ?? 0}
              icon={<HardDrive size={18} />}
              sub={`${devices?.length} device${devices.length !== 1 ? 's' : ''}`}
              accent="blue"
            />
            <StatCard
              label="Total Clips"
              value={totalClips}
              icon={<Film size={18} />}
              sub={`${totalClips} recording${totalClips !== 1 ? 's' : ''}`}
              accent="violet"
            />
            <StatCard
              label="Storage Used"
              value={formatBytes(totalSize)}
              icon={<HardDrive size={18} />}
              sub="Across all devices"
              accent="amber"
            />
          </div>

          {/* Storage indicator + Tip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <StorageIndicator used={totalSize} total={totalSize + (100 * 1024 * 1024 * 1024)} />
            </div>
            <div>
              <Tip 
                type="success" 
                title="All devices active" 
                description="Your devices are syncing normally. Keep an eye on storage to ensure continuous recording."
              />
            </div>
          </div>

          {/* Your Devices section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={20} />
                Your Devices
              </h2>
              {devices.length > 0 && (
                <Link to="/devices" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-900 border rounded-xl animate-pulse" />)}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices?.map(d => {
                const isDrone = d.id.includes('drone')
                return (
                  <div key={d.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isDrone ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                          {isDrone
                            ? <Plane size={20} className="text-violet-600 dark:text-violet-400" />
                            : <Camera size={20} className="text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{d.name}</h3>
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        </div>
                      </div>
                      <Link to={`/devices/${d.id}/settings`} title="Settings"
                        className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Settings size={14} />
                      </Link>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{d.clipCount}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Clips</p>
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatBytes(d.totalSize)}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Storage</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link to={`/devices/${d.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">
                      <Film size={14} />
                      View clips
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <QuickActions 
              actions={[
                {
                  label: 'Add Device',
                  description: 'Connect a new device',
                  icon: <Plus size={20} />,
                  href: '/devices/add',
                  color: 'blue'
                },
                {
                  label: 'View All Clips',
                  description: 'Browse your footage',
                  icon: <Film size={20} />,
                  href: '/devices',
                  color: 'emerald'
                },
                {
                  label: 'Analytics',
                  description: 'View recording stats',
                  icon: <BarChart3 size={20} />,
                  href: '/analytics',
                  color: 'amber'
                },
                {
                  label: 'Settings',
                  description: 'Manage preferences',
                  icon: <Settings size={20} />,
                  href: '/settings',
                  color: 'purple'
                }
              ]}
            />
          </div>
        </>
      )}

      {error && (
        <div className="mb-6">
          <ServerOffline onRetry={() => refetch()} />
        </div>
      )}
    </div>
  )
}

// ─── Single-device dashboard ──────────────────────────────────────────────────
function SingleDeviceDashboard() {
  const queryClient = useQueryClient()
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: getDevices })
  const device = devices?.[0]

  const { data: clips = [], isLoading } = useQuery({
    queryKey: ['clips', device?.id],
    queryFn: () => getClips(device!.id),
    enabled: !!device,
  })

  const { refreshing, pullDistance, isTriggered, progress } = usePullToRefresh({
    onRefresh: () => queryClient.invalidateQueries({ queryKey: ['clips', device?.id] }),
    disabled: !device,
  })

  const chartData = clipsByDay(clips, 14)
  const clipsToday = totalClipsToday(clips)
  const lastTime = lastClipTime(clips)
  const recentClips = [...clips]
    .sort((a, b) => b.date.localeCompare(a.date) || b.name.localeCompare(a.name))
    .slice(0, 5)

  if (isLoading || !device) {
    return <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 border rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isTriggered={isTriggered}
        refreshing={refreshing}
        progress={progress}
      />

      {/* Device header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
            {device.id.includes('drone') ? <Plane size={20} /> : <Camera size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{device.name}</h1>
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/devices/${device.id}`} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200">
            <Film size={14} />
            All clips
          </Link>
          <Link to={`/devices/${device.id}/settings`} className="p-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400">
            <Settings size={15} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
        {[
          { label: 'Total clips', value: clips.length },
          { label: 'Today', value: clipsToday || '—' },
          { label: 'Storage', value: formatBytes(device.totalSize) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border rounded-xl px-4 py-3.5 text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Clips — last 14 days</p>
          <Link to="/analytics" className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium">
            Full analytics →
          </Link>
        </div>
        <ClipsBarChart data={chartData} height={160} />
      </div>

      {/* Recent clips */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent clips</p>
          {lastTime && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={12} />
              Last at {lastTime}
            </span>
          )}
        </div>
        {recentClips.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No clips yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentClips.map(clip => (
              <Link
                key={clip.id}
                to={`/devices/${device.id}/clips/${clip.id}`}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <ClipThumbnail
                  videoUrl={streamUrl(device.id, clip.id)}
                  className="w-12 h-8 rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">{clip.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {clip.date} · {formatBytes(clip.size)}{clip.duration ? ` · ${formatDuration(clip.duration)}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
        {clips.length > 5 && (
          <div className="px-5 py-3 border-t">
            <Link to={`/devices/${device.id}`} className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium">
              View all {clips.length} clips →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Smart dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: devices, isLoading, error, refetch } = useQuery({ queryKey: ['devices'], queryFn: getDevices })
  const { data: deviceInfo } = useQuery({ queryKey: ['device-info'], queryFn: getDeviceInfo, retry: false })

  if (isLoading) {
    return <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 border rounded-xl animate-pulse" />)}</div>
  }

  if (error) {
    return <ServerOffline onRetry={() => refetch()} />
  }

  if (!devices?.length) {
    const unitReady = deviceInfo?.activated === true

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Welcome to CardBridge</h1>
        </div>

        {unitReady ? (
          /* ── Unit activated, no recording devices yet ── */
          <div className="max-w-2xl space-y-4 mb-8">
            {/* Unit status bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                <HardDrive size={15} className="text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{deviceInfo.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{deviceInfo.serial} · v{deviceInfo.version}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active
              </span>
            </div>

            {/* Primary CTA */}
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                <Camera size={18} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Add your first recording device</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Plug in a dashcam, drone, or action camera. CardBridge will sync footage automatically every time it connects.
              </p>
              <Link
                to="/devices/add"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-sm font-medium rounded-lg transition"
              >
                <Plus size={14} />
                Add device
              </Link>
            </div>
          </div>
        ) : (
          /* ── Unit not activated yet ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-8">
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                <HardDrive size={18} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Activate your unit</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Configure your CardBridge hardware and connect it to your home network.
              </p>
              <Link to="/setup" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white hover:underline">
                Start setup <ArrowRight size={14} />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                <Camera size={18} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Add a recording device</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Register a dashcam, drone, or action camera to start syncing footage.
              </p>
              <Link to="/devices/add" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline transition-colors">
                Add device <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        <Tip
          type="tip"
          title="What is CardBridge?"
          description="CardBridge is a wireless bridge for any SD-based recording device. Connect dashcams, drones, action cameras, and more to sync and manage footage automatically."
        />
      </div>
    )
  }

  return devices.length === 1 ? <SingleDeviceDashboard /> : <MultiDeviceDashboard />
}
