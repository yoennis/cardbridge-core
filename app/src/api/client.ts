import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({ baseURL: BASE_URL })

// Attach JWT to every request, dropping it first if it's already expired
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cb-token')
  if (token) {
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]))
      if (exp && Date.now() / 1000 > exp) {
        localStorage.removeItem('cb-token')
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      localStorage.removeItem('cb-token')
    }
  }
  return config
})

// On 401, clear token (expired or invalid)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cb-token')
      const next = window.location.pathname + window.location.search
      window.location.href = next === '/' || next.startsWith('/login')
        ? '/login'
        : `/login?next=${encodeURIComponent(next)}`
    }
    return Promise.reject(err)
  }
)

export interface Device {
  id: string
  name: string
  clipCount: number
  totalSize: number
  lastClip: string
}

export interface Clip {
  id: string
  deviceId: string
  name: string
  date: string
  size: number
  duration: number
}

export const getDevices = (): Promise<Device[]> =>
  api.get('/api/devices').then(r => r.data)

export const getClips = (deviceId: string): Promise<Clip[]> =>
  api.get(`/api/devices/${deviceId}/clips`).then(r => r.data)

export interface DeviceInfo {
  serial: string
  version: string
  name: string
  configured: boolean
  pinRequired: boolean
  activated: boolean
}

export const getDeviceInfo = (): Promise<DeviceInfo> =>
  api.get('/api/device/info').then(r => r.data)

export const activateDevice = (pin: string): Promise<void> =>
  api.post('/api/device/activate', { pin }).then(() => undefined)

export const streamUrl = (deviceId: string, clipId: string): string => {
  const token = localStorage.getItem('cb-token')
  return `${BASE_URL}/api/devices/${deviceId}/clips/${clipId}/stream?token=${token ?? ''}`
}
