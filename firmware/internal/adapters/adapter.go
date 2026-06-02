package adapters

import "time"

// Source is a connected device or reachable endpoint that can provide media files.
type Source struct {
	ID       string
	Name     string
	Location string // mount path (USB) or IP/hostname (WiFi)
}

// MediaFile is a single media file available from a Source.
type MediaFile struct {
	Name    string
	Path    string // local filesystem path (USB) or card-side remote path (WiFi)
	Size    int64
	ModTime time.Time
}

// MediaAdapter is the interface all device backends implement.
// Each adapter represents one class of device connection.
type MediaAdapter interface {
	// Name returns a short stable identifier, e.g. "usbmass", "wifisd".
	Name() string

	// Discover returns all currently available sources for this adapter.
	Discover() ([]Source, error)

	// ListFiles returns all media files available from the given source.
	ListFiles(src Source) ([]MediaFile, error)

	// Download copies file to dest on the local filesystem.
	// Adapters where files are already local should return nil without copying.
	Download(file MediaFile, dest string) error
}

// VideoExtensions is the set of file extensions treated as media across all adapters.
var VideoExtensions = []string{".mp4", ".mov", ".avi", ".mkv", ".ts"}
