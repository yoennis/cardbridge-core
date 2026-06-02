package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"syscall"
	"time"
)

var videoExtensions = []string{".mp4", ".mov", ".avi", ".mkv", ".ts"}

func isVideoExt(ext string) bool {
	return slices.Contains(videoExtensions, strings.ToLower(ext))
}

type Device struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	ClipCount int       `json:"clipCount"`
	TotalSize int64     `json:"totalSize"`
	LastClip  time.Time `json:"lastClip"`
}

type Clip struct {
	ID       string `json:"id"`
	DeviceID string `json:"deviceId"`
	Name     string `json:"name"`
	Date     string `json:"date"`
	Size     int64  `json:"size"`
	Duration int    `json:"duration"` // seconds, 0 if unknown
	Path     string `json:"-"`
}

type Store struct {
	root string
}

func New(root string) *Store {
	return &Store{root: root}
}

func (s *Store) StoragePath() string { return s.root }

func (s *Store) Devices() ([]Device, error) {
	entries, err := os.ReadDir(s.root)
	if err != nil {
		return nil, err
	}

	devices := make([]Device, 0)
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		// Skip directories that are empty — nothing mounted there yet
		if isDirEmpty(filepath.Join(s.root, e.Name())) {
			continue
		}

		clips, _ := s.Clips(e.Name())
		var totalSize int64
		var lastClip time.Time
		for _, c := range clips {
			totalSize += c.Size
			if t, err := time.Parse("2006-01-02", c.Date); err == nil && t.After(lastClip) {
				lastClip = t
			}
		}

		devices = append(devices, Device{
			ID:        e.Name(),
			Name:      formatDeviceName(e.Name()),
			ClipCount: len(clips),
			TotalSize: totalSize,
			LastClip:  lastClip,
		})
	}
	return devices, nil
}

func (s *Store) Clips(deviceID string) ([]Clip, error) {
	devicePath := filepath.Join(s.root, deviceID)

	// Check if device directory exists
	if info, err := os.Stat(devicePath); err != nil || !info.IsDir() {
		return []Clip{}, nil // Return empty slice for non-existent devices
	}

	clips := make([]Clip, 0)

	err := filepath.WalkDir(devicePath, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		ext := strings.ToLower(filepath.Ext(d.Name()))
		if !slices.Contains(videoExtensions, ext) {
			return nil
		}

		info, _ := d.Info()
		date := filepath.Base(filepath.Dir(path))
		rel, _ := filepath.Rel(devicePath, path)

		dur := 0
		if ext == ".mp4" || ext == ".mov" {
			dur = mp4Duration(path)
		}

		clips = append(clips, Clip{
			ID:       strings.ReplaceAll(rel, string(filepath.Separator), "_"),
			DeviceID: deviceID,
			Name:     d.Name(),
			Date:     date,
			Size:     info.Size(),
			Duration: dur,
			Path:     path,
		})
		return nil
	})

	return clips, err
}

func (s *Store) ClipPath(deviceID, clipID string) (string, bool) {
	clips, err := s.Clips(deviceID)
	if err != nil {
		return "", false
	}
	for _, c := range clips {
		if c.ID == clipID {
			return c.Path, true
		}
	}
	return "", false
}

func formatDeviceName(id string) string {
	// Well-known names
	switch id {
	case "sdcard":
		return "SD Card"
	case "wifisd":
		return "WiFi SD Card"
	}
	// USB block device partitions: sda1, sdb1, sda, sdb, ...
	// "sda" → USB Device 1, "sdb" → USB Device 2, etc.
	if len(id) >= 3 && id[:2] == "sd" && id[2] >= 'a' && id[2] <= 'z' {
		n := int(id[2]-'a') + 1
		return fmt.Sprintf("USB Device %d", n)
	}
	return strings.ReplaceAll(strings.Title(id), "-", " ")
}

// DiskUsage returns used and total bytes for the filesystem that hosts the storage root.
func (s *Store) DiskUsage() (usedBytes, totalBytes int64) {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(s.root, &stat); err != nil {
		return 0, 0
	}
	total := int64(stat.Blocks) * int64(stat.Bsize)
	free := int64(stat.Bfree) * int64(stat.Bsize)
	return total - free, total
}

// ClipsToday returns the total number of clips across all devices dated today.
func (s *Store) ClipsToday() int {
	today := time.Now().Format("2006-01-02")
	devices, err := s.Devices()
	if err != nil {
		return 0
	}
	count := 0
	for _, d := range devices {
		clips, _ := s.Clips(d.ID)
		for _, c := range clips {
			if c.Date == today {
				count++
			}
		}
	}
	return count
}

func isDirEmpty(path string) bool {
	f, err := os.Open(path)
	if err != nil {
		return true
	}
	defer f.Close()
	_, err = f.Readdirnames(1)
	return err == io.EOF
}
