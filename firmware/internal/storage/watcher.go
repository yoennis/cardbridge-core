package storage

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// stableDelay is how long we wait after the last write event before
// considering a file fully written and triggering the callback.
// This handles slow USB transfers and WiFi SD downloads gracefully.
const stableDelay = 10 * time.Second

// Watcher monitors the storage root for new video files and calls OnNew
// once each file is stable (no more write activity for stableDelay).
// New directories (e.g. USB devices auto-mounted under /mnt) are watched
// automatically when they appear.
type Watcher struct {
	root    string
	store   *Store
	onNew   func(Clip)
	fw      *fsnotify.Watcher
	timers  map[string]*time.Timer
	mu      sync.Mutex
}

func NewWatcher(root string, store *Store, onNew func(Clip)) (*Watcher, error) {
	fw, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	return &Watcher{
		root:  root,
		store: store,
		onNew: onNew,
		fw:    fw,
		timers: make(map[string]*time.Timer),
	}, nil
}

// Start adds watches to the root and all existing subdirectories, then runs
// the event loop in a background goroutine.
func (w *Watcher) Start() {
	w.addDirRecursive(w.root)
	go w.loop()
	log.Printf("Watcher: monitoring %s", w.root)
}

func (w *Watcher) Close() {
	w.fw.Close()
}

func (w *Watcher) loop() {
	for {
		select {
		case event, ok := <-w.fw.Events:
			if !ok {
				return
			}
			w.handle(event)
		case err, ok := <-w.fw.Errors:
			if !ok {
				return
			}
			log.Printf("Watcher error: %v", err)
		}
	}
}

func (w *Watcher) handle(event fsnotify.Event) {
	path := event.Name

	// New directory (e.g. USB device mounted) — start watching it
	if event.Has(fsnotify.Create) {
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			w.addDirRecursive(path)
			return
		}
	}

	if !event.Has(fsnotify.Create) && !event.Has(fsnotify.Write) {
		return
	}
	if !isVideoExt(filepath.Ext(path)) {
		return
	}

	// Debounce: reset the timer every time we see activity on this file
	w.mu.Lock()
	if t, ok := w.timers[path]; ok {
		t.Stop()
	}
	w.timers[path] = time.AfterFunc(stableDelay, func() {
		w.mu.Lock()
		delete(w.timers, path)
		w.mu.Unlock()
		w.emit(path)
	})
	w.mu.Unlock()
}

func (w *Watcher) emit(path string) {
	info, err := os.Stat(path)
	if err != nil || info.Size() == 0 {
		return
	}

	rel, err := filepath.Rel(w.root, path)
	if err != nil {
		return
	}
	parts := strings.SplitN(rel, string(filepath.Separator), 2)
	if len(parts) < 1 {
		return
	}

	dur := 0
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".mp4" || ext == ".mov" {
		dur = mp4Duration(path)
	}

	clip := Clip{
		ID:       strings.ReplaceAll(rel, string(filepath.Separator), "_"),
		DeviceID: parts[0],
		Name:     filepath.Base(path),
		Size:     info.Size(),
		Duration: dur,
		Path:     path,
	}
	w.onNew(clip)
}

func (w *Watcher) addDirRecursive(root string) {
	_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || !d.IsDir() {
			return nil
		}
		if watchErr := w.fw.Add(path); watchErr != nil {
			log.Printf("Watcher: cannot watch %s: %v", path, watchErr)
		}
		return nil
	})
}
