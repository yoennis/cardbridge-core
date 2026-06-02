// Package usbmass implements the MediaAdapter interface for USB mass storage devices.
// Any camera, drone, or SD reader connected via USB and auto-mounted by the system
// (via udev rules) is discovered and served from its mount directory.
// Download is a no-op — files are already on the local filesystem after mount.
package usbmass

import (
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/yoennis/cardbridge-core/internal/adapters"
)

// Adapter discovers USB mass storage devices mounted under a root directory.
type Adapter struct {
	root string
}

func New(root string) *Adapter {
	return &Adapter{root: root}
}

func (a *Adapter) Name() string { return "usbmass" }

// Discover returns one Source per non-empty subdirectory under the root.
// Each subdirectory corresponds to a mounted USB device or SD reader.
func (a *Adapter) Discover() ([]adapters.Source, error) {
	entries, err := os.ReadDir(a.root)
	if err != nil {
		return nil, err
	}
	var sources []adapters.Source
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		mountPath := filepath.Join(a.root, e.Name())
		if isEmpty(mountPath) {
			continue
		}
		sources = append(sources, adapters.Source{
			ID:       e.Name(),
			Name:     formatName(e.Name()),
			Location: mountPath,
		})
	}
	return sources, nil
}

// ListFiles returns all media files under the source's mount location.
func (a *Adapter) ListFiles(src adapters.Source) ([]adapters.MediaFile, error) {
	var files []adapters.MediaFile
	err := filepath.WalkDir(src.Location, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		if !slices.Contains(adapters.VideoExtensions, strings.ToLower(filepath.Ext(d.Name()))) {
			return nil
		}
		info, _ := d.Info()
		files = append(files, adapters.MediaFile{
			Name:    d.Name(),
			Path:    path,
			Size:    info.Size(),
			ModTime: info.ModTime(),
		})
		return nil
	})
	return files, err
}

// Download is a no-op — USB mass storage files are already local after mount.
func (a *Adapter) Download(_ adapters.MediaFile, _ string) error { return nil }

func isEmpty(path string) bool {
	f, err := os.Open(path)
	if err != nil {
		return true
	}
	defer f.Close()
	_, err = f.Readdirnames(1)
	return err != nil
}

func formatName(id string) string {
	switch id {
	case "sdcard":
		return "SD Card"
	case "wifisd":
		return "WiFi SD Card"
	}
	if len(id) >= 3 && id[:2] == "sd" && id[2] >= 'a' && id[2] <= 'z' {
		return fmt.Sprintf("USB Device %d", int(id[2]-'a')+1)
	}
	return strings.ReplaceAll(strings.Title(id), "-", " ") //nolint:staticcheck
}
