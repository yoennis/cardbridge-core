import { useState, useCallback } from 'react'
import { api } from '../api/client'

export interface NotifPrefs {
  newClips: boolean
  storageFull: boolean
  deviceStatus: boolean
}

const DEFAULTS: NotifPrefs = {
  newClips: true,
  storageFull: true,
  deviceStatus: false,
}

const KEY = 'cb-notif-prefs'

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export function useNotifications() {
  const supported = 'Notification' in window

  const [permission, setPermission] = useState<NotificationPermission>(
    () => (supported ? Notification.permission : 'denied')
  )
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs)

  const requestPermission = useCallback(async () => {
    if (!supported) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || permission !== 'granted') return
    try {
      const reg = await navigator.serviceWorker.ready
      const { data } = await api.get<{ publicKey: string }>('/api/notifications/vapid-key')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })
      const json = sub.toJSON()
      await api.post('/api/notifications/subscribe', {
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      })
    } catch {
      // SW not available in dev or subscription failed — silently skip
    }
  }, [permission])

  const updatePref = useCallback((key: keyof NotifPrefs, value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const sendTest = useCallback(async () => {
    if (permission !== 'granted') return
    try {
      await api.post('/api/notifications/test', {})
    } catch {
      // fallback to local notification when SW push isn't set up
      new Notification('CardBridge', {
        body: "Notifications are working — you'll be alerted when new clips are recorded.",
        icon: '/pwa-192.svg',
        tag: 'cb-test',
      })
    }
  }, [permission])

  return { supported, permission, prefs, requestPermission, subscribe, updatePref, sendTest }
}
