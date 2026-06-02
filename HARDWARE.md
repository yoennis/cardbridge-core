# Hardware Guide

Reference configurations for running CardBridge Core on a Raspberry Pi.
These are examples — adapt to your specific device and use case.

---

## Compute unit — Raspberry Pi Zero 2W

The recommended compute unit for single-device or embedded deployments.

- ARM Cortex-A53 quad-core 64-bit @ 1 GHz, 512 MB RAM
- 802.11 b/g/n WiFi (brcmfmac — supports virtual `uap0` for dual WiFi mode)
- One micro-USB port (OTG capable — USB host or device)
- microSD slot (for the OS — not for device footage)

**Where to buy:** raspberrypi.com, Adafruit, SparkFun, Micro Center, Amazon.
Stock can be limited — check multiple vendors.

### Alternatives

| Board | Notes |
|-------|-------|
| Orange Pi Zero 2W (~$15–20) | Better availability. Verify dual WiFi (`uap0`) on your kernel. |
| Raspberry Pi 4 (~$35–55) | More powerful, larger form factor. Good for desktop/always-on builds. |
| Any ARM64 Linux board | As long as it supports USB OTG and WiFi, the firmware runs unchanged. |

---

## Component reference

| Part | Spec | Approx. cost | Notes |
|------|------|-------------|-------|
| Raspberry Pi Zero 2W | — | $15 | |
| microSD (OS) | 16–32 GB, Class 10 / A1 | $7–10 | Samsung EVO Select or SanDisk Ultra A1 |
| Powered USB OTG hub | micro-USB OTG in + separate power + 2–4× USB-A | $10–15 | Must have separate power input. Ugreen and Waveshare make Pi-compatible models. |
| USB-C power supply | 5 V / 3 A | $8–10 | Standard phone charger works |
| USB SD card reader | USB-A, microSD + full SD | $6–8 | Any UHS-I reader |
| USB-A → USB-C cable (30 cm) | — | $5–6 | For drones / GoPro / USB-C cameras |
| ezShare WiFi microSD | 32 GB | $20–25 | For the experimental `wifisd` adapter |

---

## Example configurations

### Minimal — single USB device

```
Pi Zero 2W
+ USB OTG Y-splitter    ($6)  ← one leg powers Pi, one is USB-A host
+ USB-C charger         ($8)
+ USB-A → USB-C cable   ($6)
─────────────────────────────
BOM ~$35
```

Plug one drone, GoPro, or action cam via USB. Sync, unplug.
No SD reader, no multi-device support — simplest possible setup.

### Multi-device — USB hub + SD reader

```
Pi Zero 2W
+ Powered USB hub (2–4 port)   ($12)  ← replaces Y-splitter
+ USB SD card reader           ($7)   ← for cameras without USB storage mode
+ USB-C charger                ($8)
+ Cables                       ($6)
─────────────────────────────────────
BOM ~$48
```

Connect multiple devices simultaneously. SD reader handles cameras that
don't support USB Mass Storage mode (most trail cams, some action cams).

### WiFi SD — experimental

```
Multi-device configuration above    (~$48)
+ ezShare WiFi microSD 32 GB        ($23)
─────────────────────────────────────────
BOM ~$71
```

> **Experimental.** The WiFi SD card stays in the camera — no SD removal needed.
> Sync happens **after recording stops**. Real-time sync during active recording
> is not guaranteed due to power delivery constraints and I/O contention.
> Validate with your specific camera before building a product on this pattern.
> See [COMPATIBILITY.md](COMPATIBILITY.md) for the experimental adapter details.

---

## Sourcing by region

| Region | Best options |
|--------|-------------|
| USA | Amazon, Adafruit, SparkFun, Micro Center |
| Mexico / LATAM | Amazon MX, MercadoLibre, AliExpress (longer shipping) |
| Europe | The Pi Hut (UK), BerryBase (DE), Amazon EU |
| Global | AliExpress — OTG hubs, cables, SD readers are significantly cheaper |

---

## Power budget

The Pi Zero 2W draws ~350 mA at idle, up to ~600 mA under load.
A USB device in active transfer draws an additional 100–500 mA depending on type.

**Minimum:** 5 V / 2 A supply with a powered hub (hub provides power to devices separately).
A Y-splitter without a powered hub risks brownouts when a device is active.
