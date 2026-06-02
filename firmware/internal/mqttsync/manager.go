package mqttsync

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Config holds the MQTT broker connection parameters.
type Config struct {
	Broker   string `json:"broker"`   // e.g. "tcp://192.168.1.10:1883"
	User     string `json:"user"`
	Password string `json:"password"`
}

// Manager is a thread-safe wrapper around Client that supports hot-reconnect
// and persists config to a JSON file so it survives restarts.
type Manager struct {
	mu         sync.RWMutex
	client     *Client
	serial     string
	configPath string
}

func NewManager(serial, configPath string) *Manager {
	return &Manager{serial: serial, configPath: configPath}
}

// LoadAndConnect reads saved config from disk and connects if a broker is set.
func (m *Manager) LoadAndConnect() {
	cfg, err := m.loadConfig()
	if err != nil || cfg.Broker == "" {
		return
	}
	if err := m.Reconnect(cfg); err != nil {
		// Non-fatal: service starts without MQTT, user can retry from UI
		_ = err
	}
}

// Reconnect disconnects the existing client (if any) and connects with new config.
// Passing an empty Broker disconnects without reconnecting.
func (m *Manager) Reconnect(cfg Config) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.client != nil {
		m.client.Disconnect()
		m.client = nil
	}

	if cfg.Broker == "" {
		_ = m.saveConfig(cfg)
		return nil
	}

	c, err := Connect(m.serial, cfg.Broker, cfg.User, cfg.Password)
	if err != nil {
		return err
	}
	c.AnnounceDiscovery()
	m.client = c
	return m.saveConfig(cfg)
}

// Client returns the active MQTT client, or nil if not connected.
func (m *Manager) Client() *Client {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.client
}

// Config returns the persisted configuration (password masked).
func (m *Manager) Config() (Config, bool) {
	cfg, err := m.loadConfig()
	if err != nil {
		return Config{}, false
	}
	return cfg, cfg.Broker != ""
}

// Connected reports whether there is an active MQTT connection.
func (m *Manager) Connected() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.client != nil && m.client.mc.IsConnected()
}

func (m *Manager) loadConfig() (Config, error) {
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		return Config{}, err
	}
	var cfg Config
	return cfg, json.Unmarshal(data, &cfg)
}

func (m *Manager) saveConfig(cfg Config) error {
	if err := os.MkdirAll(filepath.Dir(m.configPath), 0700); err != nil {
		return err
	}
	data, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	return os.WriteFile(m.configPath, data, 0600)
}
