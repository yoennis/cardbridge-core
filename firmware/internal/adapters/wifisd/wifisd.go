// Package wifisd implements an experimental MediaAdapter for WiFi SD cards (FlashAir, ezShare).
//
// Status: EXPERIMENTAL
//   - Designed for post-recording sync. Real-time sync during active recording is not guaranteed.
//   - Power delivery from cameras to WiFi SD cards is unreliable (300–500 mA vs 10–50 mA passive).
//   - I/O contention between camera write and WiFi read on the same NAND is undefined behavior.
//   - For most use cases, USB mass storage (usbmass adapter) is the recommended path.
package wifisd

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"strconv"
	"time"

	"github.com/yoennis/cardbridge-core/internal/adapters"
)

// Type selects the HTTP API dialect used by the card.
type Type string

const (
	FlashAir Type = "flashair" // Toshiba FlashAir W-03/W-04
	EzShare  Type = "ezshare"  // ezShare / generic clones
)

// Adapter implements MediaAdapter for a single configured WiFi SD card.
// The card must be reachable at host — either its AP IP (192.168.4.1) or
// the IP it received from the home router in station/bridge mode.
type Adapter struct {
	host    string
	sdType  Type
	client  *http.Client
}

func New(host string, sdType Type) *Adapter {
	return &Adapter{
		host:   host,
		sdType: sdType,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (a *Adapter) Name() string { return "wifisd" }

// Discover returns the configured card as the sole source.
// Reachability is checked lazily when ListFiles is called.
func (a *Adapter) Discover() ([]adapters.Source, error) {
	return []adapters.Source{{
		ID:       a.host,
		Name:     fmt.Sprintf("WiFi SD (%s)", a.sdType),
		Location: a.host,
	}}, nil
}

// ListFiles queries the card's HTTP API and returns available video files.
func (a *Adapter) ListFiles(src adapters.Source) ([]adapters.MediaFile, error) {
	var raw []rawFile
	var err error
	switch a.sdType {
	case EzShare:
		raw, err = a.ezshareList("DCIM")
	default:
		raw, err = a.flashairList("/DCIM")
	}
	if err != nil {
		return nil, err
	}
	files := make([]adapters.MediaFile, 0, len(raw))
	for _, r := range raw {
		files = append(files, adapters.MediaFile{
			Name: filepath.Base(r.remotePath),
			Path: r.remotePath,
			Size: r.size,
		})
	}
	return files, nil
}

// Download fetches the file from the card to dest on the local filesystem.
func (a *Adapter) Download(file adapters.MediaFile, dest string) error {
	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return err
	}
	var rawURL string
	switch a.sdType {
	case EzShare:
		encoded := strings.ReplaceAll(file.Path, `\`, "%5C")
		rawURL = fmt.Sprintf("http://%s/download?file=%s", a.host, encoded)
	default:
		rawURL = fmt.Sprintf("http://%s%s", a.host, file.Path)
	}
	return a.fetchToFile(rawURL, dest)
}

// Poller wraps the Adapter and runs a sync loop in a background goroutine,
// downloading new files to destDir on a fixed interval.
type Poller struct {
	adapter *Adapter
	destDir string
	interval time.Duration
}

func NewPoller(host string, sdType Type, destDir string, interval time.Duration) *Poller {
	return &Poller{
		adapter:  New(host, sdType),
		destDir:  destDir,
		interval: interval,
	}
}

// Start runs the sync loop in a background goroutine.
func (p *Poller) Start() {
	go func() {
		for {
			if err := p.sync(); err != nil {
				log.Printf("wifisd (%s): %v", p.adapter.host, err)
			}
			time.Sleep(p.interval)
		}
	}()
}

func (p *Poller) sync() error {
	src := adapters.Source{ID: p.adapter.host, Location: p.adapter.host}
	files, err := p.adapter.ListFiles(src)
	if err != nil {
		return err
	}
	var downloaded int
	for _, f := range files {
		localPath := filepath.Join(p.destDir, strings.ReplaceAll(f.Path, `\`, "/"))
		if info, err := os.Stat(localPath); err == nil {
			if f.Size == 0 || info.Size() == f.Size {
				continue
			}
		}
		if err := p.adapter.Download(f, localPath); err != nil {
			log.Printf("wifisd download %s: %v", f.Path, err)
			continue
		}
		downloaded++
	}
	if downloaded > 0 {
		log.Printf("wifisd: %d new file(s) synced from %s", downloaded, p.adapter.host)
	}
	return nil
}

// ── FlashAir API ──────────────────────────────────────────────────────────────

func (a *Adapter) flashairList(dir string) ([]rawFile, error) {
	u := fmt.Sprintf("http://%s/command.cgi?op=100&DIR=%s", a.host, dir)
	resp, err := a.client.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var files []rawFile
	sc := bufio.NewScanner(resp.Body)
	for sc.Scan() {
		line := sc.Text()
		if line == "WLANSD_FILELIST" || line == "" {
			continue
		}
		parts := strings.SplitN(line, ",", 6)
		if len(parts) < 4 {
			continue
		}
		entryDir := parts[0]
		name := parts[1]
		size, _ := strconv.ParseInt(parts[2], 10, 64)
		attr, _ := strconv.Atoi(parts[3])

		if attr&0x10 != 0 {
			sub, err := a.flashairList(entryDir + "/" + name)
			if err == nil {
				files = append(files, sub...)
			}
			continue
		}
		if !isVideo(filepath.Ext(name)) {
			continue
		}
		files = append(files, rawFile{remotePath: entryDir + "/" + name, size: size})
	}
	return files, sc.Err()
}

// ── ezShare API ───────────────────────────────────────────────────────────────

func (a *Adapter) ezshareList(bsPath string) ([]rawFile, error) {
	encoded := strings.ReplaceAll(bsPath, `\`, "%5C")
	u := fmt.Sprintf("http://%s/dir?dir=A:%s", a.host, encoded)

	resp, err := a.client.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var files []rawFile
	for _, line := range strings.Split(string(body), "\n") {
		name, ok := parseEzShareLink(line)
		if !ok || name == "" || name == "." || name == ".." {
			continue
		}
		childPath := bsPath + `\` + name

		if strings.Contains(line, "<DIR>") || strings.Contains(line, "&lt;DIR&gt;") {
			sub, err := a.ezshareList(childPath)
			if err == nil {
				files = append(files, sub...)
			}
			continue
		}
		if !isVideo(filepath.Ext(name)) {
			continue
		}
		files = append(files, rawFile{remotePath: childPath})
	}
	return files, nil
}

func parseEzShareLink(line string) (name string, ok bool) {
	if !strings.Contains(line, `href="`) {
		return "", false
	}
	open := strings.Index(line, ">")
	if open < 0 {
		return "", false
	}
	open++
	close := strings.Index(line[open:], "<")
	if close < 0 {
		return "", false
	}
	return strings.TrimSpace(line[open : open+close]), true
}

// ── Shared helpers ────────────────────────────────────────────────────────────

type rawFile struct {
	remotePath string
	size       int64
}

func (a *Adapter) fetchToFile(rawURL, localPath string) error {
	resp, err := a.client.Get(rawURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, rawURL)
	}
	tmp := localPath + ".tmp"
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
	return os.Rename(tmp, localPath)
}

func isVideo(ext string) bool {
	return slices.Contains(adapters.VideoExtensions, strings.ToLower(ext))
}
