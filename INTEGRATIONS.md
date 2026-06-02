# Integration Patterns

This document describes how CardBridge Core can interoperate with existing
device-specific applications — without either system needing to adopt the
other's codebase.

The general model: CardBridge Core handles **file acquisition** (WiFi SD polling,
USB auto-mount, download). The downstream application handles **domain-specific
processing** (parsing, analysis, storage, reporting). They communicate through
a shared directory on the local filesystem.

---

## HMS CPAP — via local filesystem

[HMS CPAP](https://github.com/hms-homelab/hms-cpap) is an independent C++ application
that collects and analyzes sleep therapy data from ResMed and Lowenstein Prisma CPAP
machines. It has its own file acquisition layer (`EzShareClient`, `FysetcDataSource`)
and is not built on CardBridge Core.

However, both systems independently implement the same pattern — WiFi SD polling via
the ezShare HTTP API — and HMS CPAP supports a `local` source mode that reads from
a directory on the filesystem. This creates a natural interoperability point.

### How it would work

```
[CPAP machine]
  writes therapy data normally
    ↓
[ezShare WiFi SD card — inside the CPAP]
  exposes HTTP API on local network
    ↓
[Raspberry Pi running CardBridge Core]
  wifisd adapter polls the card every 30s
  downloads .edf / .csv files to /mnt/wifisd/
    ↓
[HMS CPAP — CPAP_SOURCE=local, watching /mnt/wifisd/]
  SessionDiscoveryService groups files into sessions
  EDFParser parses therapy data
  MQTT + dashboard + PDF reports
```

### What needs to happen

**On the CardBridge Core side:**

Extend the file extension filter to pick up CPAP data files:

```go
// In your adapter or scanner configuration:
var CPAPExtensions = append(adapters.VideoExtensions,
    ".edf", ".csv", ".dat", ".wmedf",
)
```

Set `CARDBRIDGE_WIFISD_HOST` to the IP of the ezShare card and
`CARDBRIDGE_STORAGE_PATH` to a directory HMS CPAP can read from.

**On the HMS CPAP side:**

```bash
# In HMS CPAP config.json:
CPAP_SOURCE=local
CPAP_LOCAL_DIR=/path/to/cardbridge/storage/wifisd
```

HMS CPAP's `SessionDiscoveryService` already handles this mode — no code changes required.

### Status

**Pattern: validated concept, not yet tested end-to-end.**

The interoperability relies on:
- CardBridge Core's `wifisd` adapter successfully downloading files from the ezShare card
- HMS CPAP's `CPAP_SOURCE=local` mode picking up those files correctly
- File naming conventions matching what HMS CPAP's `SessionDiscoveryService` expects

Neither system has been modified for this integration. This document describes
the intended path, not a production deployment.

### Why this split makes sense

| Responsibility | CardBridge Core | HMS CPAP |
|---------------|-----------------|----------|
| WiFi SD polling | ✓ (`wifisd` adapter) | ✓ (`EzShareClient.cpp`) |
| USB/SD reader mount | ✓ (`usbmass` adapter) | via `CPAP_SOURCE=local` |
| EDF/WMEDF parsing | — | ✓ (`cpapdash-parser`) |
| Therapy metrics | — | ✓ (47+ metrics, AHI, etc.) |
| PDF reports | — | ✓ (`ReportGeneratorService`) |
| MQTT publishing | ✓ (optional) | ✓ (Home Assistant) |
| Local dashboard | ✓ (React PWA) | ✓ (Angular + Drogon) |

CardBridge Core would replace HMS CPAP's download layer only. Everything
downstream — parsing, metrics, reporting, MQTT — stays in HMS CPAP unchanged.

---

## General pattern — CardBridge Core as acquisition layer

Any application that processes files from USB or SD devices can use CardBridge Core
for the acquisition step, regardless of language or framework:

```
CardBridge Core                     Your application
──────────────                      ────────────────
wifisd or usbmass adapter    →→→    Read from CARDBRIDGE_STORAGE_PATH
downloads files to local dir  →→→    Process with your own parser/logic
file watcher fires callbacks  →→→    (or poll the directory yourself)
```

Your application reads from the directory. CardBridge Core writes to it.
No API calls, no shared libraries, no language coupling.

The only coordination needed is agreeing on:

- The storage path (`CARDBRIDGE_STORAGE_PATH`)
- The directory structure (`/device-id/date/filename`)
- Which file extensions CardBridge should pick up

---

## Contributing an integration

If you build an integration with CardBridge Core, open a PR to add it here.
Include: what the downstream application does, what changed on each side,
and whether it has been tested end-to-end.
