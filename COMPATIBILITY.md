# CardBridge — Device Compatibility

This document tracks which devices are known to work with CardBridge, the recommended
connection method, and any caveats. Entries marked **Tested** have been verified on real
hardware. Entries marked **Expected** are based on protocol/spec — unverified on hardware.

---

## How to read this table

| Column | Meaning |
|--------|---------|
| **Connection** | How the device connects to CardBridge |
| **Adapter** | Which CardBridge adapter handles it |
| **Status** | Tested / Expected / Not supported |
| **Notes** | Caveats, required settings, known issues |

---

## Drones

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| DJI Mini 2 / Mini 3 | USB-C → hub | usbmass | Expected | Enable USB Mass Storage mode in DJI Fly settings |
| DJI Mini 4 Pro | USB-C → hub | usbmass | Expected | USB Mass Storage mode required |
| DJI Air 2S | USB-C → hub | usbmass | Expected | USB Mass Storage mode required |
| DJI Mavic 3 series | USB-C → hub | usbmass | Expected | USB Mass Storage mode required |
| DJI Avata / Avata 2 | USB-C → hub | usbmass | Expected | USB Mass Storage mode required |
| Generic drone (USB-C) | USB-C → hub | usbmass | Expected | Must expose USB Mass Storage |

> **DJI note:** Most DJI drones require switching to "Mass Storage" mode in the DJI Fly app
> before connecting via USB. The drone must be powered on during transfer.

---

## Action cameras

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| GoPro Hero 11 / 12 / 13 | USB-C → hub | usbmass | Expected | Enable "MTP + charging" or "Mass Storage" in GoPro settings |
| GoPro Hero 9 / 10 | USB-C → hub | usbmass | Expected | Same as above |
| Insta360 X3 / X4 | USB-C → hub | usbmass | Expected | USB Mass Storage mode in Insta360 app |
| Insta360 ONE RS | USB-C → hub | usbmass | Expected | USB Mass Storage mode |
| DJI Action 4 / 5 | USB-C → hub | usbmass | Expected | USB Mass Storage mode required |
| Sony RX0 II | micro-USB → hub | usbmass | Expected | MTP mode may require driver on Pi — test needed |

---

## Trail cameras / wildlife cameras

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| Any trail cam with SD slot | SD card → USB reader | usbmass | Expected | Remove SD, insert in USB reader |
| Bushnell Core series | SD card → USB reader | usbmass | Expected | microSD or full SD depending on model |
| Moultrie Edge series | SD card → USB reader | usbmass | Expected | microSD |
| Spypoint Link-S | SD card → USB reader | usbmass | Expected | microSD |
| Stealth Cam series | SD card → USB reader | usbmass | Expected | SD or microSD |

> **Trail cam note:** Trail cameras rarely support direct USB connection. The recommended
> workflow is SD card → USB reader → CardBridge hub. Fast and reliable on all models.

---

## SD card readers (standalone)

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| Any USB-A SD card reader | USB-A → hub | usbmass | Expected | Full SD and microSD (via adapter) |
| Any USB-C SD card reader | USB-C → hub | usbmass | Expected | |
| Multi-slot USB hub/reader | USB → hub | usbmass | Expected | Each slot appears as a separate device |

---

## DSLRs and mirrorless cameras

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| Canon DSLR / R-series | USB-B or USB-C → hub | usbmass | Expected | Set camera to "Mass Storage" in menu |
| Nikon DSLR / Z-series | USB-C or micro-USB → hub | usbmass | Expected | Set to "Mass Storage" (not MTP) |
| Sony Alpha series | USB-C → hub | usbmass | Expected | Set "USB Connection" to "Mass Storage" |
| Fujifilm X series | USB-C → hub | usbmass | Expected | Set "USB Connection" to "Mass Storage" |

---

## CPAP / medical devices

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| ResMed AirSense 10/11 | SD card → USB reader | usbmass | Tested* | *Via CardBridge Core (HMS CPAP project) |
| Philips DreamStation | SD card → USB reader | usbmass | Tested* | *Via CardBridge Core (HMS CPAP project) |

> These devices were validated as part of an external project built on CardBridge Core.
> See ["Built with CardBridge Core"](PRODUCT.md) for context.

---

## Dashcams

Dashcam support depends heavily on the camera's connection mode.
Most dashcams do not expose USB Mass Storage while recording.

| Device | Connection | Adapter | Status | Notes |
|--------|-----------|---------|--------|-------|
| Any dashcam with USB-A | USB → hub, powered off | usbmass | Expected | Only works when dashcam is **not recording** |
| Any dashcam with SD slot | SD card → USB reader | usbmass | Expected | Must remove SD card |
| Viofo A229 series | USB-C → hub | usbmass | Expected | USB Mass Storage mode, not recording |
| BlackVue DR series | WiFi direct (proprietary) | — | Not supported | Proprietary WiFi protocol |
| Nextbase series | WiFi direct (proprietary) | — | Not supported | Proprietary WiFi protocol |

> **Dashcam reality check:** Real-time sync while driving is not supported in the current
> version. Dashcam sync works when the vehicle is parked and the camera is powered off or idle.
> Wireless real-time dashcam sync is planned for a future WiFi-direct hub adapter.

---

## WiFi SD cards (experimental)

WiFi SD card support is experimental. See [README](README.md) for full caveats.

| Card | Type config | Status | Notes |
|------|-----------|--------|-------|
| Toshiba FlashAir W-04 | `flashair` | Experimental | Post-recording sync only |
| ezShare WiFi SD | `ezshare` | Experimental | Post-recording sync only |
| ezShare clones (generic) | `ezshare` | Experimental | Firmware varies — may not work |
| microSD WiFi cards | any | Not recommended | Power delivery from cameras unreliable |

---

## Not supported

| Category | Reason |
|----------|--------|
| Proprietary WiFi protocols (BlackVue, Nextbase) | Closed protocols, no open spec |
| Cameras requiring manufacturer software | Cannot mount as Mass Storage |
| Real-time dashcam sync while recording | I/O contention + power constraints |

---

## Contributing a compatibility report

If you test a device not listed here, open an issue or PR with:
- Device make and model
- Connection method used
- Whether it worked (yes / partial / no)
- Any required settings on the device side

Compatibility reports from real hardware are the most valuable contribution to this project.
