# CardBridge — Architecture

## System overview

```
Recording Devices
────────────────────────────────────────────────────────────────────
┌──────────────┐   ┌───────────────┐   ┌─────────────────────────┐
│  Dash cam    │   │  Drone /      │   │  Any USB Mass Storage   │
│  Viofo /     │   │  Action cam   │   │  DSLR / Trail cam /     │
│  BlackVue /  │   │  DJI / GoPro  │   │  Body cam / 360° cam /  │
│  Nextbase…   │   │  Insta360…    │   │  Cycling cam / etc.     │
└──────┬───────┘   └──────┬────────┘   └───────────┬─────────────┘
       │                  │                         │

Connection Methods
────────────────────────────────────────────────────────────────────
┌──────┴───────┐   ┌──────┴────────┐   ┌───────────┴─────────────┐
│  ezShare /   │   │  USB cable    │   │  USB SD card reader      │
│  FlashAir    │   │  (USB Mass    │   │  (any SD/microSD card)   │
│  WiFi SD     │   │   Storage)    │   │                         │
└──────┬───────┘   └──────┬────────┘   └───────────┬─────────────┘
  WiFi HTTP API       USB OTG hub              USB OTG hub
  poll every 30s      port                     port
       │                  │                         │
       └──────────────────┴─────────────────────────┘
                          │

CardBridge Device — Raspberry Pi Zero 2W
────────────────────────────────────────────────────────────────────
                 ┌────────▼──────────────────────────┐
                 │  System Services                   │
                 │  ├── udev + cb-mount               │ auto-mount USB → /mnt/*
                 │  ├── hostapd (uap0 virtual iface)  │ AP hotspot broadcast
                 │  ├── dnsmasq                       │ DHCP for AP clients
                 │  └── wpa_supplicant                │ home WiFi client (wlan0)
                 │                                    │
                 │  CardBridge Go Server (single bin) │
                 │  ├── WiFi SD Poller                │ FlashAir + ezShare HTTP API
                 │  │     downloads → /mnt/wifisd/   │
                 │  ├── fsnotify Watcher              │ inotify on /mnt, debounce 10s
                 │  │     new clip → VAPID push       │
                 │  ├── JWT Auth (HS256)              │ register / login / me
                 │  ├── HTTP Range Streaming          │ video on demand
                 │  ├── VAPID Web Push                │ push to subscribed phones
                 │  └── React PWA (go:embed all:dist) │ served as static files
                 │                                    │
                 │  SQLite (cardbridge.db)            │
                 │  ├── users                         │
                 │  ├── push_subscriptions            │
                 │  └── vapid_keys                    │
                 │                                    │
                 │  Storage root: /mnt/               │
                 │  ├── sda1/   ← USB device          │
                 │  ├── sdb1/   ← SD card reader      │
                 │  └── wifisd/ ← WiFi SD downloads   │
                 └────────────────┬──────────────────-┘
                                  │
               ┌──────────────────┴──────────────────┐
               │                                     │
     ┌─────────▼──────────┐             ┌────────────▼──────────┐
     │  Home WiFi (wlan0) │             │  AP Hotspot (uap0)    │
     │  cardbridge.local  │             │  SSID: CardBridge     │
     │  :8080             │             │  pass: cardbridge     │
     │  (mDNS via avahi)  │             │  192.168.4.1:8080     │
     └─────────┬──────────┘             └────────────┬──────────┘
               │                                     │
               └──────────────────┬──────────────────┘
                                  │  HTTP / WebPush (VAPID)

Client — Phone or browser
────────────────────────────────────────────────────────────────────
                 ┌────────▼──────────────────────────┐
                 │  React PWA (installable)           │
                 │  ├── TanStack Query (data fetching)│
                 │  ├── Service Worker (sw.ts)        │
                 │  │     workbox precache + push     │
                 │  ├── Push Notifications (VAPID)    │
                 │  ├── Offline banner + reconnect    │
                 │  ├── HTTP range video streaming    │
                 │  ├── Canvas clip thumbnails        │
                 │  └── Pull-to-refresh               │
                 └────────────────────────────────────┘
```

---

## Data flow — new clip detected

```
Recording device saves new file to SD card
          │
          ▼ (one of three paths)
┌─────────────────┬──────────────────┬─────────────────┐
│  USB connected  │  WiFi SD card    │  SD card reader │
│  (Mass Storage) │  (ezShare/Flash) │  via USB        │
└────────┬────────┘ └───────┬────────┘ └────────┬───────┘
         │   udev event     │  poller downloads  │  udev event
         │   cb-mount       │  to /mnt/wifisd/   │  cb-mount
         └──────────────────┴────────────────────┘
                            │
                     file lands in /mnt/
                            │
                    fsnotify write event
                            │
                     debounce 10 seconds
                            │
                 mp4Duration() — pure Go moov/mvhd parser
                            │
                     OnNewClip(clip)
                            │
              query push_subscriptions from SQLite
                            │
                 webpush.SendNotification() per subscriber
                            │
               ┌────────────▼─────────────┐
               │  Push notification       │
               │  "CardBridge — new clip" │
               │  "clip.mp4 · 2m34s"     │
               └────────────┬─────────────┘
                            │
                     Phone screen lights up
                            │
                  User taps → PWA opens → clip ready to stream
```

---

## Deployment pipeline

```
Developer Mac
      │
      ├── make build-pi-all
      │     ├── npm run build  (React → app/dist/)
      │     └── GOOS=linux GOARCH=arm64 go build  (embeds dist/)
      │
      └── ./scripts/install.sh [pi@cardbridge.local]
            ├── SCP binary → /opt/cardbridge/server
            ├── Write .env  (JWT secret, WiFi SD config)
            ├── Enable + restart systemd service
            └── Optional: configure home WiFi via wpa_supplicant

First-time Pi setup (run once on the Pi):
      bash setup-pi.sh
        ├── avahi-daemon   → cardbridge.local mDNS
        ├── udev rules     → USB auto-mount
        ├── hostapd        → AP on uap0 (CardBridge SSID)
        └── dnsmasq        → DHCP 192.168.4.2–20
```

---

## WiFi dual-mode (simultaneous AP + client)

```
Physical chip: brcmfmac (Pi Zero 2W built-in)
      │
      ├── wlan0  ← home WiFi client (wpa_supplicant)
      │           → cardbridge.local:8080
      │
      └── uap0   ← virtual AP interface (hostapd)
                  → SSID: CardBridge / 192.168.4.1:8080

Both interfaces run simultaneously on the same hardware.
No switching, no fallback logic, no internet required.
```

---

## Repository layout

```
cardbridge/
├── firmware/               Go server
│   ├── cmd/server/         main.go — wires everything together
│   ├── internal/
│   │   ├── api/            handlers, router, push notifications
│   │   ├── config/         env-var config
│   │   ├── db/             SQLite schema + migrations
│   │   └── storage/        clip scanner, mp4 parser, WiFi SD poller, watcher
│   ├── web/
│   │   ├── embed.go        //go:embed all:dist
│   │   └── dist/           populated by make build-pi-all
│   ├── mock-data/          local dev fixtures
│   ├── scripts/
│   │   ├── setup-pi.sh     first-time Pi OS configuration
│   │   └── install.sh      build + deploy from Mac
│   └── Makefile
│
├── app/                    React PWA
│   ├── src/
│   │   ├── pages/          Dashboard, Clips, AddDevice, Settings
│   │   ├── hooks/          useNotifications, useAuth, useDevices
│   │   ├── core/           layout, auth provider, router
│   │   └── sw.ts           service worker (workbox + push events)
│   └── vite.config.ts      injectManifest PWA mode
│
├── landing/                Next.js marketing site
│   ├── app/                App Router pages
│   └── components/         Nav, Hero, Pricing, FAQ…
│
├── .github/workflows/ci.yml   Go + TypeScript CI
├── README.md               Project overview and quick start
├── ARCHITECTURE.md         ← this file
├── HARDWARE.md             Reference hardware configurations and BOM
├── COMPATIBILITY.md        Tested and expected device compatibility
├── ADAPTERS.md             Guide for building custom adapters
├── INTEGRATIONS.md         Integration patterns with external applications
├── SECURITY.md             Security model and configuration
└── examples/               Minimal adapter implementations
```
