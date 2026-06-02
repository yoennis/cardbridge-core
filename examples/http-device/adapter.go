// Package httpdevice is a minimal example of a CardBridge Core MediaAdapter.
//
// It connects to a hypothetical device that exposes a JSON file listing over HTTP:
//
//	GET http://<host>/files           → [{name, size}, ...]
//	GET http://<host>/download/<name> → raw file bytes
//
// Replace the HTTP API calls with whatever your device actually exposes.
// The interface contract (Name, Discover, ListFiles, Download) stays the same.
package httpdevice

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/yoennis/cardbridge-core/internal/adapters"
)

// Adapter implements adapters.MediaAdapter for a single HTTP-based device.
type Adapter struct {
	host   string
	client *http.Client
}

// New creates an adapter for the device at host (e.g. "192.168.1.42").
func New(host string) *Adapter {
	return &Adapter{
		host:   host,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Name returns a stable identifier used in logs and the storage directory name.
func (a *Adapter) Name() string { return "http-device" }

// Discover returns the single configured device as a Source.
// For multi-device protocols, return one Source per discovered device.
func (a *Adapter) Discover() ([]adapters.Source, error) {
	return []adapters.Source{{
		ID:       a.host,
		Name:     "HTTP Device",
		Location: a.host,
	}}, nil
}

// ListFiles queries the device's HTTP API and returns available files.
func (a *Adapter) ListFiles(src adapters.Source) ([]adapters.MediaFile, error) {
	resp, err := a.client.Get(fmt.Sprintf("http://%s/files", src.Location))
	if err != nil {
		return nil, fmt.Errorf("list files: %w", err)
	}
	defer resp.Body.Close()

	var items []struct {
		Name string `json:"name"`
		Size int64  `json:"size"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	files := make([]adapters.MediaFile, len(items))
	for i, item := range items {
		files[i] = adapters.MediaFile{
			Name: item.Name,
			Path: item.Name, // used as the key in Download()
			Size: item.Size,
		}
	}
	return files, nil
}

// Download fetches a file from the device and writes it to dest.
func (a *Adapter) Download(file adapters.MediaFile, dest string) error {
	resp, err := a.client.Get(fmt.Sprintf("http://%s/download/%s", a.host, file.Path))
	if err != nil {
		return fmt.Errorf("download %s: %w", file.Name, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("download %s: HTTP %d", file.Name, resp.StatusCode)
	}

	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return err
	}

	// Write to a temp file first — avoids partial writes on crash/interrupt.
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
