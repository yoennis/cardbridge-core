# Building a Custom Adapter

CardBridge Core uses a pluggable adapter architecture. Every device type — USB cameras,
WiFi SD cards, IP cameras, CPAP machines, lab equipment — is handled by an adapter that
implements a single interface.

This guide walks you through building your own.

---

## The interface

```go
// package: github.com/yoennis/cardbridge-core/internal/adapters

type MediaAdapter interface {
    Name() string
    Discover() ([]Source, error)
    ListFiles(src Source) ([]MediaFile, error)
    Download(file MediaFile, dest string) error
}

type Source struct {
    ID       string
    Name     string
    Location string // mount path (USB) or IP/hostname (WiFi)
}

type MediaFile struct {
    Name    string
    Path    string
    Size    int64
    ModTime time.Time
}

var VideoExtensions = []string{".mp4", ".mov", ".avi", ".mkv", ".ts"}
```

---

## Built-in adapters

| Adapter | Package | Status | Notes |
|---------|---------|--------|-------|
| USB mass storage | `adapters/usbmass` | Stable | Drones, action cams, DSLRs, SD readers |
| WiFi SD card | `adapters/wifisd` | Experimental | FlashAir, ezShare — post-recording only |

---

## Example: a minimal custom adapter

This example implements an adapter for a hypothetical device that exposes files over HTTP.

```go
package myadapter

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "time"

    "github.com/yoennis/cardbridge-core/internal/adapters"
)

type Adapter struct {
    host   string
    client *http.Client
}

func New(host string) *Adapter {
    return &Adapter{
        host:   host,
        client: &http.Client{Timeout: 30 * time.Second},
    }
}

func (a *Adapter) Name() string { return "myadapter" }

func (a *Adapter) Discover() ([]adapters.Source, error) {
    // Return one source per reachable device.
    // For a fixed-host device (e.g. CPAP, lab equipment), return one source.
    return []adapters.Source{{
        ID:       a.host,
        Name:     "My Device",
        Location: a.host,
    }}, nil
}

func (a *Adapter) ListFiles(src adapters.Source) ([]adapters.MediaFile, error) {
    // Call your device's HTTP API to list files.
    resp, err := a.client.Get(fmt.Sprintf("http://%s/files", src.Location))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result []struct {
        Name string `json:"name"`
        Size int64  `json:"size"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    files := make([]adapters.MediaFile, len(result))
    for i, r := range result {
        files[i] = adapters.MediaFile{
            Name: r.Name,
            Path: r.Name,
            Size: r.Size,
        }
    }
    return files, nil
}

func (a *Adapter) Download(file adapters.MediaFile, dest string) error {
    resp, err := a.client.Get(fmt.Sprintf("http://%s/download/%s", a.host, file.Path))
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
        return err
    }
    tmp := dest + ".tmp"
    f, err := os.Create(tmp)
    if err != nil {
        return err
    }
    _, copyErr := io.Copy(f, resp.Body)
    f.Close()
    if copyErr != nil {
        os.Remove(tmp)
        return copyErr
    }
    return os.Rename(tmp, dest)
}
```

---

## Registering your adapter

Once you have an adapter, plug it into the polling loop. You can model it after the
`wifisd.Poller` in `adapters/wifisd/wifisd.go`:

```go
type Poller struct {
    adapter  adapters.MediaAdapter
    destDir  string
    interval time.Duration
}

func (p *Poller) Start() {
    go func() {
        for {
            if err := p.sync(); err != nil {
                log.Printf("%s: %v", p.adapter.Name(), err)
            }
            time.Sleep(p.interval)
        }
    }()
}

func (p *Poller) sync() error {
    sources, err := p.adapter.Discover()
    if err != nil {
        return err
    }
    for _, src := range sources {
        files, err := p.adapter.ListFiles(src)
        if err != nil {
            continue
        }
        for _, f := range files {
            dest := filepath.Join(p.destDir, src.ID, f.Name)
            if _, err := os.Stat(dest); err == nil {
                continue // already downloaded
            }
            p.adapter.Download(f, dest)
        }
    }
    return nil
}
```

Then start it from `main.go`:

```go
poller := myadapter.NewPoller(cfg.MyDeviceHost, destDir, 60*time.Second)
poller.Start()
```

---

## Example use case: CPAP therapy data sync

CardBridge Core's adapter pattern maps directly to medical device data sync.
A CPAP machine (ResMed AirSense, Philips DreamStation) writes therapy data to an SD card.
The workflow:

1. SD card → USB reader → CardBridge hub
2. `usbmass` adapter detects the card as a mounted volume
3. The scanner walks the directory and picks up `.edf` / `.csv` files
4. Files appear in the local dashboard — no cloud, no account required

The only change needed from the default setup:
1. Extend the file extension list to include `.edf`, `.csv`, `.dat`
2. The storage scanner handles any extension — the filter is the only gate

This is the same pattern as the `usb-camera` example — only the file types differ.

---

## File extension support

`adapters.VideoExtensions` controls which files get picked up. For non-video verticals:

```go
// In your adapter or a custom scanner:
var DataExtensions = append(adapters.VideoExtensions, ".edf", ".csv", ".dat", ".fit")
```

Or override the scanner entirely — the `storage.Store` just walks a directory. Your adapter
can write files there and they'll be indexed automatically.

---

## Questions and integrations

If you're building on CardBridge Core and want to discuss architecture, open an issue or
reach out directly — open an issue or email via the contact in the README.
