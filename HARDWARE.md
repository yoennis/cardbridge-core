# CardBridge — Hardware Guide

## Raspberry Pi Zero 2W — the compute unit

The Pi Zero 2W is the only supported compute unit for now. It has:
- ARM Cortex-A53 quad-core 64-bit @ 1 GHz, 512 MB RAM
- 802.11 b/g/n WiFi (brcmfmac driver — supports virtual `uap0` interface for dual WiFi)
- Bluetooth 4.2 / BLE
- One micro-USB port (OTG capable — acts as USB host or device)
- microSD slot (for Pi OS — **not** for footage)

**Where to buy:**
- [raspberrypi.com](https://raspberrypi.com/products/raspberry-pi-zero-2-w/) — official, sometimes out of stock
- Adafruit (US): adafruit.com
- SparkFun (US): sparkfun.com
- Micro Center (US): usually has stock in-store
- Amazon

**Stock warning:** The Zero 2W has historically had stock issues. Check multiple vendors.

### Alternative: Orange Pi Zero 2W (~$15–20)
Similar hardware, usually better availability. The dual WiFi (virtual `uap0`) needs to be
verified on whatever kernel ships with the OS image. Worth testing before committing to it.

### Alternative: Raspberry Pi 4 Model B (~$35–55)
More powerful, excellent stock, but physically larger. Suitable for a
"desktop" or "always-on home hub" product variant.

---

## Bill of materials per unit

| Part | Spec | Approx. cost | Notes |
|------|------|-------------|-------|
| Raspberry Pi Zero 2W | — | $15 | See above |
| microSD (Pi OS) | 16–32 GB, Class 10 / A1 | $7–10 | Samsung EVO Select or SanDisk Ultra A1 |
| Powered USB OTG hub | micro-USB OTG input + USB-C/barrel power input + 2–4× USB-A | $10–15 | Must have **separate** power input. Ugreen and Waveshare make Pi-compatible models. Search "micro USB OTG hub powered separate power" |
| USB-C power supply | 5 V / 3 A | $8–10 | Standard phone charger works |
| USB SD card reader | USB-A, supports microSD + full SD | $6–8 | Any UHS-I reader |
| USB-A → USB-C cable 30 cm | — | $5–6 | For drones / GoPro / USB-C cameras |
| ezShare WiFi microSD | 32 GB | $20–25 | Amazon: search "ezShare WiFi microSD". Used when SD stays inside the device |
| Case (optional) | Pi Zero form factor | $5–8 | 3D-printed or off-shelf |

---

## Per-tier BOM

### Tier 1 — CardBridge Go (~$43 BOM)
```
Pi Zero 2W          $15
microSD (Pi OS)     $ 8
USB OTG Y-splitter  $ 6   ← single-port, powers Pi and connects ONE USB device
USB-C charger       $ 8
USB-A→USB-C cable   $ 6
```
> Y-splitter instead of a full hub: one leg powers the Pi, the other is a USB-A host port.
> Simplest possible setup — plug the drone/GoPro directly, sync, unplug.

### Tier 2 — CardBridge (~$64 BOM)
```
Everything in Tier 1      $43
Powered USB hub (4-port)  $12   ← replaces Y-splitter
USB SD card reader        $ 7   ← for devices without USB storage mode
USB-A→USB-C cable         $ 6
```
> Multiple devices at once. Lector SD para los que no soportan USB Mass Storage.

### Tier 3 — CardBridge Dash (~$87 BOM) — experimental
```
Everything in Tier 2      $64
ezShare WiFi microSD 32GB $23
```
> **Experimental.** The WiFi SD card stays in the camera — no SD removal.
> Sync happens post-recording (after the camera stops writing).
> Real-time sync during active recording is **not guaranteed** due to power delivery
> constraints and I/O contention on the card's NAND. Validate with your specific camera
> model before building a product on this tier.

---

## In-car installation (dashcam — experimental)

> **Note:** USB sync requires the dashcam to be powered off or idle (not actively recording).
> WiFi SD sync via ezShare works post-recording. Real-time sync while driving is experimental
> and depends on camera model. See [COMPATIBILITY.md](COMPATIBILITY.md) for tested devices.


Mount the CardBridge unit behind the dashboard or in the glovebox:

```
[Fuse box / always-on 12V] → [USB car adapter 5V/3A] → [CardBridge]
                                                               │
                                                         USB hub
                                                               │
                                                    [Dashcam — short cable]
```

- Power from a **switched** fuse (turns off with the car) or **always-on** fuse depending on preference.
- At home: Pi auto-connects to home WiFi → clips appear in app.
- On the road: Pi broadcasts `CardBridge` AP → connect phone directly.

**Recommended USB car adapters:** Anker PowerDrive Speed 2 or similar (look for ≥ 3 A on at least one port).

---

## Sourcing by region

| Region | Best options |
|--------|-------------|
| USA | Amazon, Adafruit, SparkFun, Micro Center |
| Mexico / LATAM | Amazon MX, MercadoLibre, importación directa de AliExpress |
| Europe | The Pi Hut (UK), BerryBase (DE), Amazon EU |
| Global | AliExpress (longer shipping, lower cost — good for OTG hubs and cables) |

**AliExpress tip:** The OTG hub, USB cables, SD reader, and ezShare card are all significantly
cheaper on AliExpress if 3–4 week shipping is acceptable.
