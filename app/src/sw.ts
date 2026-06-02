import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? { title: 'CardBridge', body: '' }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'CardBridge', {
      body: data.body,
      icon: '/pwa-192.svg',
      badge: '/pwa-192.svg',
      tag: data.tag ?? 'cb-push',
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const win = clients[0]
      if (win) return win.focus()
      return self.clients.openWindow('/')
    })
  )
})
