import { useState, useCallback } from 'react'

export type DeviceType = 'dashcam' | 'drone' | 'action' | 'medical' | 'other'

export interface DeviceMeta {
  displayName: string
  type: DeviceType
  notes: string
}

const KEY = 'cb-device-meta'

function load(): Record<string, DeviceMeta> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  dashcam: 'Dash Cam',
  drone: 'Drone',
  action: 'Action Cam',
  medical: 'Medical Device',
  other: 'Other',
}

export { DEVICE_TYPE_LABELS }

export function useDeviceMeta(deviceId: string) {
  const [allMeta, setAllMeta] = useState(load)

  const meta: DeviceMeta = allMeta[deviceId] ?? {
    displayName: deviceId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: deviceId.includes('drone') ? 'drone' : 'dashcam',
    notes: '',
  }

  const save = useCallback((updates: Partial<DeviceMeta>) => {
    setAllMeta(prev => {
      const next = { ...prev, [deviceId]: { ...meta, ...updates } }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [deviceId, meta])

  return { meta, save }
}
