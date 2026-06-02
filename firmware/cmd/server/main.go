package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"path/filepath"
	"time"

	"github.com/yoennis/cardbridge-core/internal/adapters/wifisd"
	"github.com/yoennis/cardbridge-core/internal/api"
	"github.com/yoennis/cardbridge-core/internal/config"
	"github.com/yoennis/cardbridge-core/internal/db"
	"github.com/yoennis/cardbridge-core/internal/mqttsync"
	"github.com/yoennis/cardbridge-core/internal/storage"
)

func main() {
	cfg := config.Load()

	database, err := db.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	store := storage.New(cfg.StoragePath)
	serial := api.GetOrCreateSerial()

	// MQTT manager — optional, persists config and supports hot-reconnect from UI
	mqttCfgPath := filepath.Join(api.DataDir(), "mqtt.json")
	mqttMgr := mqttsync.NewManager(serial, mqttCfgPath)
	if cfg.MQTTBroker != "" {
		if err := mqttMgr.Reconnect(mqttsync.Config{
			Broker:   cfg.MQTTBroker,
			User:     cfg.MQTTUser,
			Password: cfg.MQTTPassword,
		}); err != nil {
			log.Printf("MQTT: %v", err)
		}
	} else {
		mqttMgr.LoadAndConnect()
	}

	h := api.NewHandler(store, database, cfg.JWTSecret, mqttMgr)
	router := api.BuildRouter(h, cfg.JWTSecret, cfg.AppOrigin)

	// File watcher — notifies subscribed phones and MQTT when a new clip is detected
	if watcher, err := storage.NewWatcher(cfg.StoragePath, store, func(clip storage.Clip) {
		h.OnNewClip(clip)
		if mc := mqttMgr.Client(); mc != nil {
			mc.PublishClip(clip.DeviceID, clip.Name, clip.Size, clip.Duration)
		}
	}); err != nil {
		log.Printf("Warning: file watcher unavailable: %v", err)
	} else {
		watcher.Start()
	}

	// WiFi SD card poller — experimental adapter, post-recording sync only
	if cfg.WifiSDHost != "" {
		sdType := wifisd.Type(cfg.WifiSDType)
		destDir := filepath.Join(cfg.StoragePath, "wifisd")
		poller := wifisd.NewPoller(cfg.WifiSDHost, sdType, destDir, 30*time.Second)
		poller.Start()
		log.Printf("wifisd poller [experimental]: type=%s host=%s → %s", sdType, cfg.WifiSDHost, destDir)
	}

	// MQTT storage stats — periodic publish every 15 min
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if mc := mqttMgr.Client(); mc != nil {
				used, total := store.DiskUsage()
				mc.PublishStorage(used, total)
				devices, _ := store.Devices()
				mc.PublishStats(store.ClipsToday(), len(devices))
			}
		}
	}()

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("CardBridge Core running on %s", addr)
	log.Printf("Storage: %s  DB: %s", cfg.StoragePath, cfg.DBPath)
	logLocalAddresses(cfg.Port)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}
}

func logLocalAddresses(port string) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil || ip.To4() == nil {
				continue
			}
			log.Printf("Network: http://%s:%s  (%s)", ip.String(), port, iface.Name)
		}
	}
}
