# Example: HTTP device adapter

A minimal adapter for a device that exposes files over HTTP.

## What it shows

- How to implement the `MediaAdapter` interface
- The `Discover` → `ListFiles` → `Download` pattern
- Atomic file writes (`.tmp` rename to avoid partial files)

## Adapting this to your device

1. **Change `ListFiles`** to call your device's actual API
2. **Change `Download`** to fetch files the way your device serves them
3. **Change `Name()`** to a stable identifier for your device type

## File types

By default CardBridge Core picks up video files (`.mp4`, `.mov`, `.avi`, `.mkv`, `.ts`).
To pick up other types (`.edf`, `.csv`, `.jpg`, `.gcode`, etc.), extend the extension list
in the scanner or filter in `ListFiles` before returning.

## Wiring it in

```go
// In your main.go (or wherever you start adapters):
import "github.com/yoennis/cardbridge-core/examples/http-device"

adapter := httpdevice.New("192.168.1.42")
sources, _ := adapter.Discover()
files, _ := adapter.ListFiles(sources[0])
for _, f := range files {
    adapter.Download(f, filepath.Join(destDir, f.Name))
}
```

Or wrap it in a `Poller` (see [ADAPTERS.md](../../ADAPTERS.md)) for automatic periodic sync.
