# CardBridge Core

Local-first media sync engine for SD-based and USB devices. Runs on a Raspberry Pi Zero 2W.
No cloud. No subscription. No vendor lock-in.

**Use CardBridge Core as a platform** to build local sync solutions for any device that
exposes files over USB or a network API — cameras, drones, CPAP machines, trail cams,
lab equipment, and more.

```
[any USB / SD / WiFi device] ──► [CardBridge Core on RPi] ──► [PWA on any device]
```

---

## What it provides

| Component | Description |
|-----------|-------------|
| **Go firmware** | HTTP server, JWT auth, SQLite, file watcher, range streaming |
| **MediaAdapter interface** | Pluggable device backends — add any device in ~2 hours |
| **React PWA** | Clip browser, push notifications, offline-capable |
| **MQTT integration** | Optional Home Assistant / smart home bridge |
| **USB auto-mount** | udev rules for automatic device detection |
| **Dual WiFi** | Home network client + AP hotspot simultaneously |

---

## Reference implementation

[CardBridge](https://cardbridge.io) is the consumer product built on this core —
drones, action cams, and trail cams via USB and SD reader.

## Integration patterns

The adapter interface works for any device that writes files to USB or SD storage.
See [INTEGRATIONS.md](INTEGRATIONS.md) for documented patterns, including how
CardBridge Core can interoperate with existing device-specific applications.

Building something? [See the adapter guide →](ADAPTERS.md)

---

## Quick start

### Hardware

| Part | Cost |
|------|------|
| Raspberry Pi Zero 2W | ~$15 |
| USB OTG hub (powered) | ~$10–15 |
| USB-C power supply (≥ 2.5 A) | ~$8 |
| microSD card (≥ 8 GB) | ~$5 |

**Total: ~$35–45**

### Development

```bash
# Terminal 1 — firmware
cd firmware
go run ./cmd/server

# Terminal 2 — frontend
cd app
npm install && npm run dev
```

Open `http://localhost:5173`. Uses mock clips from `mock-data/` by default.

### Deploy to Pi

```bash
# Flash Raspberry Pi OS Lite 64-bit, SSH in, then:
bash scripts/setup-pi.sh
sudo reboot

# From your Mac/PC:
cd firmware
./scripts/install.sh
```

---

## Adapters

CardBridge Core ships with two adapters:

### `adapters/usbmass` — primary

Discovers USB mass storage devices mounted under the storage root. Works with any device
that exposes USB Mass Storage mode: drones, action cams, DSLRs, SD readers, trail cams.

`Download()` is a no-op — files are already local after auto-mount.

### `adapters/wifisd` — experimental

Polls FlashAir and ezShare WiFi SD cards over HTTP. Works for post-recording sync.
Real-time sync during active recording is not guaranteed (power delivery + I/O contention).

See [ADAPTERS.md](ADAPTERS.md) to build your own adapter.

---

## MediaAdapter interface

```go
type MediaAdapter interface {
    Name() string
    Discover() ([]Source, error)
    ListFiles(src Source) ([]MediaFile, error)
    Download(file MediaFile, dest string) error
}
```

[Full adapter guide with examples →](ADAPTERS.md)

---

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness check |
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT |
| GET | `/api/devices` | JWT | List devices |
| GET | `/api/devices/:id/clips` | JWT | List clips |
| GET | `/api/devices/:id/clips/:id/stream` | JWT | Stream video (range requests) |
| POST | `/api/notifications/subscribe` | JWT | Push notification subscription |

---

## Configuration

All config via environment variables:

```bash
CARDBRIDGE_STORAGE_PATH=../mock-data   # where device files are indexed
CARDBRIDGE_PORT=8080
CARDBRIDGE_JWT_SECRET=change-me
CARDBRIDGE_DB_PATH=./cardbridge.db

# WiFi SD (experimental)
CARDBRIDGE_WIFISD_HOST=192.168.1.50
CARDBRIDGE_WIFISD_TYPE=flashair        # or: ezshare

# MQTT (optional)
MQTT_BROKER=tcp://192.168.1.10:1883
MQTT_USER=
MQTT_PASSWORD=
```

---

## Build

```bash
cd firmware

make build          # local binary
make build-pi       # arm64 Linux (RPi Zero 2W)
make build-pi-all   # frontend + arm64 binary  ← use for deployment
make clean
```

---

## WiFi modes

The Pi Zero 2W runs both modes simultaneously (virtual interface `uap0`):

| Mode | SSID | URL | When |
|------|------|-----|------|
| Home network | your router | `http://cardbridge.local:8080` | At home |
| Access Point | `CardBridge` | `http://192.168.4.1:8080` | On location |

---

## Device compatibility

See [COMPATIBILITY.md](COMPATIBILITY.md) for the full tested device matrix.

---

## Stack

**Firmware:** Go 1.22 · chi router · modernc SQLite · JWT HS256 · VAPID push · fsnotify

**App:** React 18 · TypeScript · Vite · TanStack Query · Tailwind CSS · PWA

---

## License

MIT — build whatever you want on top of this.
