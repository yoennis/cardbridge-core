import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trash2, SlidersHorizontal, Tag, Layers, StickyNote, Save, Wifi, Settings } from 'lucide-react'
import { toast } from '../utils/toast'
import { getClips, getDevices } from '../api/client'
import { formatBytes } from '../utils/format'
import { useDeviceMeta, DEVICE_TYPE_LABELS, type DeviceType } from '../hooks/useDeviceMeta'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'


const DEVICE_TYPES: DeviceType[] = ['dashcam', 'drone', 'action', 'medical', 'other']

function Field({ label, hint, icon: Icon, children }: { label: string; hint?: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
        {Icon && <Icon size={13} className="text-slate-400 dark:text-slate-500" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

export default function DeviceSettingsPage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const navigate = useNavigate()
  const { meta, save } = useDeviceMeta(deviceId!)

  const [form, setForm] = useState({ displayName: meta.displayName, type: meta.type, notes: meta.notes })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: clips } = useQuery({
    queryKey: ['clips', deviceId],
    queryFn: () => getClips(deviceId!),
    enabled: !!deviceId,
  })
  const { data: devices } = useQuery({ queryKey: ['devices'], queryFn: getDevices })
  const device = devices?.find(d => d.id === deviceId)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    save(form)
    toast.success('Device settings saved')
  }

  const handleDelete = () => {
    // Phase 0: just clears metadata and goes back
    // Phase 1: will call DELETE /api/devices/:id to remove the folder
    const raw = localStorage.getItem('cb-device-meta')
    if (raw) {
      const all = JSON.parse(raw)
      delete all[deviceId!]
      localStorage.setItem('cb-device-meta', JSON.stringify(all))
    }
    navigate('/devices')
  }

  return (
    <div>
      <PageHeader
        title={meta.displayName}
        subtitle="Device configuration"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Devices', href: '/devices' },
          { label: meta.displayName }
        ]}
        icon={<Settings size={24} />}
      />

      {/* Stats */}
      {device && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Clips"
            value={clips?.length ?? device.clipCount}
            icon={<Layers size={20} className="text-slate-600 dark:text-slate-400" />}
            sub="Total recordings"
          />
          <StatCard
            label="Storage"
            value={formatBytes(device.totalSize)}
            icon={<Tag size={20} className="text-slate-600 dark:text-slate-400" />}
            sub="Used on device"
          />
          <StatCard
            label="Last recording"
            value={device.lastClip && device.lastClip !== '0001-01-01T00:00:00Z' ? new Date(device.lastClip).toLocaleDateString() : '—'}
            icon={<Wifi size={20} className="text-slate-600 dark:text-slate-400" />}
            sub="Most recent activity"
          />
        </div>
      )}

      {/* Config form */}
      <form onSubmit={handleSave}>
        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden mb-6">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b">
            <SlidersHorizontal size={15} className="text-slate-400 dark:text-slate-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">General</h2>
          </div>
          <div className="p-6 space-y-5">
            <Field label="Display name" hint="How this device appears in the app" icon={Tag}>
              <input
                type="text"
                placeholder="Device name"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition"
              />
            </Field>

            <Field label="Device type" icon={Layers}>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {DEVICE_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                      form.type === t
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-900/5 dark:bg-slate-100/5 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {DEVICE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Notes" hint="Optional — model, location, license plate, etc." icon={StickyNote}>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="e.g. Toyota Camry front cam, 70mai A800"
                className="w-full px-3 py-2.5 rounded-lg border bg-transparent text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </Field>
          </div>
        </div>

        {/* Sync settings — Phase 1 placeholder */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden mb-6 opacity-60">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi size={15} className="text-slate-400 dark:text-slate-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Sync & Storage</h2>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              Coming in Phase 1
            </span>
          </div>
          <div className="p-6 space-y-4 pointer-events-none select-none">
            {['Auto-sync when on home WiFi', 'Keep clips for 30 days', 'Auto-backup to cloud'].map(label => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
                <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-sm font-medium rounded-lg transition"
          >
            <Save size={14} />
            Save changes
          </button>

          {/* Danger zone */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <Trash2 size={14} />
              Remove device
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Are you sure?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
