import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Camera, Plane, Clapperboard, Settings, Film, HardDrive, Activity } from 'lucide-react'
import { getDevices, type Device } from '../api/client'
import { formatBytes } from '../utils/format'
import { DEVICE_TYPE_LABELS, type DeviceType } from '../hooks/useDeviceMeta'
import ServerOffline from '../components/ServerOffline'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { Button } from '../components/ui'

const TYPE_ICONS: Record<DeviceType | string, React.ElementType> = {
  dashcam: Camera,
  drone: Plane,
  action: Clapperboard,
  security: Activity,
  other: HardDrive,
}

function loadAllMeta(): Record<string, { displayName?: string; type?: DeviceType }> {
  try { return JSON.parse(localStorage.getItem('cb-device-meta') ?? '{}') } catch { return {} }
}

export default function DevicesPage() {
  const { data: devices, isLoading, error, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  })
  const allMeta = loadAllMeta()

  const resolvedName = (d: Device) => allMeta[d.id]?.displayName ?? d.name
  const resolvedType = (d: Device): DeviceType => allMeta[d.id]?.type ?? (d.id.includes('drone') ? 'drone' : 'dashcam')

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage and configure your connected devices"
        action={
          <Link to="/devices/add">
            <Button icon={<Plus size={16} />}>Add Device</Button>
          </Link>
        }
      />

      {error && <ServerOffline onRetry={() => refetch()} />}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !error && devices?.length === 0 && (
        <EmptyState
          icon={<HardDrive size={24} />}
          title="No devices found"
          description="Add your first CardBridge device to get started."
          action={{
            label: 'Add Device',
            onClick: () => { window.location.href = '/devices/add' },
          }}
        />
      )}

      {!!devices?.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => {
            const type = resolvedType(device)
            const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.other
            const iconStyle = type === 'drone'
              ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
              : type === 'action'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'

            return (
              <div key={device.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconStyle}`}>
                    <Icon size={21} />
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Name + type */}
                <div className="flex-1 mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-0.5">{resolvedName(device)}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{DEVICE_TYPE_LABELS[type]}</p>
                </div>

                {/* Stats pills */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Film size={11} /> Clips</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{device.clipCount}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><HardDrive size={11} /></span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatBytes(device.totalSize)}</span>
                  </div>
                </div>

                {/* Actions — always visible */}
                <div className="flex gap-2">
                  <Link to={`/devices/${device.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">
                    <Film size={13} /> View clips
                  </Link>
                  <Link to={`/devices/${device.id}/settings`}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Settings size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
