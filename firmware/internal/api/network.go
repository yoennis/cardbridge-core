package api

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type WifiNetwork struct {
	SSID     string `json:"ssid"`
	Signal   int    `json:"signal"`   // 0–100
	Security string `json:"security"` // "WPA2", "WPA3", "open", etc.
}

// ScanWifi runs nmcli to list nearby networks, deduplicates, and sorts by signal.
func (h *Handler) ScanWifi(w http.ResponseWriter, r *http.Request) {
	out, err := exec.CommandContext(r.Context(),
		"nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "dev", "wifi", "list",
	).Output()
	if err != nil {
		writeError(w, "wifi scan unavailable", http.StatusServiceUnavailable)
		return
	}

	seen := map[string]bool{}
	var networks []WifiNetwork
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		parts := strings.SplitN(line, ":", 3)
		if len(parts) < 2 {
			continue
		}
		ssid := strings.TrimSpace(parts[0])
		if ssid == "" || seen[ssid] {
			continue
		}
		seen[ssid] = true
		signal, _ := strconv.Atoi(strings.TrimSpace(parts[1]))
		security := "open"
		if len(parts) == 3 && strings.TrimSpace(parts[2]) != "" {
			security = strings.TrimSpace(parts[2])
		}
		networks = append(networks, WifiNetwork{SSID: ssid, Signal: signal, Security: security})
	}
	sort.Slice(networks, func(i, j int) bool { return networks[i].Signal > networks[j].Signal })
	writeJSON(w, networks)
}

type NetworkConfig struct {
	APSSID       string `json:"apSsid"`
	APPassword   string `json:"apPassword"`
	HomeSSID     string `json:"homeSsid"`
	HomePassword string `json:"homePassword"`
}

func networkConfigPath() string {
	dir := os.Getenv("CARDBRIDGE_DATA_DIR")
	if dir == "" {
		dir = "/var/lib/cardbridge"
	}
	return filepath.Join(dir, "network.json")
}

func (h *Handler) GetNetworkConfig(w http.ResponseWriter, r *http.Request) {
	cfg := NetworkConfig{}
	data, err := os.ReadFile(networkConfigPath())
	if err == nil {
		if err := json.Unmarshal(data, &cfg); err != nil {
			writeError(w, "failed to parse network config", http.StatusInternalServerError)
			return
		}
	}
	// Never return passwords in plaintext — send back masked values
	if cfg.APPassword != "" {
		cfg.APPassword = "••••••••"
	}
	if cfg.HomePassword != "" {
		cfg.HomePassword = "••••••••"
	}
	writeJSON(w, cfg)
}

// ConnectHomeWifi saves WiFi credentials and immediately attempts to connect
// via nmcli. Returns connected=true and the assigned IP on success.
func (h *Handler) ConnectHomeWifi(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SSID     string `json:"ssid"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SSID == "" {
		writeError(w, "ssid is required", http.StatusBadRequest)
		return
	}

	// Persist the credentials first so they survive reboots
	existing := NetworkConfig{}
	if data, err := os.ReadFile(networkConfigPath()); err == nil {
		_ = json.Unmarshal(data, &existing)
	}
	existing.HomeSSID = strings.TrimSpace(req.SSID)
	existing.HomePassword = req.Password
	if data, err := json.MarshalIndent(existing, "", "  "); err == nil {
		os.MkdirAll(filepath.Dir(networkConfigPath()), 0o755)
		os.WriteFile(networkConfigPath(), data, 0o600)
	}

	ctx := r.Context()
	const conName = "cardbridge-home"

	// Remove any stale profile so we start clean
	exec.CommandContext(ctx, "nmcli", "connection", "delete", conName).Run()

	// Build connection with explicit WPA2 security to avoid key-mgmt errors
	// that occur with `nmcli dev wifi connect` on some Debian versions.
	addArgs := []string{
		"connection", "add",
		"type", "wifi",
		"ifname", "wlan0",
		"con-name", conName,
		"ssid", req.SSID,
		"wifi-sec.key-mgmt", "wpa-psk",
	}
	if req.Password != "" {
		addArgs = append(addArgs, "wifi-sec.psk", req.Password)
	}
	if out, err := exec.CommandContext(ctx, "nmcli", addArgs...).CombinedOutput(); err != nil {
		writeJSON(w, map[string]any{"connected": false, "error": strings.TrimSpace(string(out))})
		return
	}

	out, err := exec.CommandContext(ctx, "nmcli", "connection", "up", conName).CombinedOutput()
	if err != nil {
		msg := strings.TrimSpace(string(out))
		if msg == "" {
			msg = "connection failed"
		}
		writeJSON(w, map[string]any{"connected": false, "error": msg})
		return
	}

	// Get assigned IP
	ip := ""
	if ipOut, err := exec.CommandContext(ctx,
		"nmcli", "-t", "-f", "IP4.ADDRESS", "dev", "show", "wlan0",
	).Output(); err == nil {
		for _, line := range strings.Split(string(ipOut), "\n") {
			if strings.HasPrefix(line, "IP4.ADDRESS") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					ip = strings.TrimSpace(strings.Split(parts[1], "/")[0])
					break
				}
			}
		}
	}

	writeJSON(w, map[string]any{"connected": true, "ip": ip, "ssid": req.SSID})
}

func (h *Handler) SetNetworkConfig(w http.ResponseWriter, r *http.Request) {
	var req NetworkConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request", http.StatusBadRequest)
		return
	}

	req.APSSID = strings.TrimSpace(req.APSSID)
	req.HomeSSID = strings.TrimSpace(req.HomeSSID)

	// Load existing config so we can preserve passwords when the masked
	// placeholder is submitted (user didn't change them)
	existing := NetworkConfig{}
	if data, err := os.ReadFile(networkConfigPath()); err == nil {
		_ = json.Unmarshal(data, &existing)
	}
	if req.APPassword == "••••••••" {
		req.APPassword = existing.APPassword
	}
	if req.HomePassword == "••••••••" {
		req.HomePassword = existing.HomePassword
	}

	data, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		writeError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if err := os.MkdirAll(filepath.Dir(networkConfigPath()), 0o755); err != nil {
		writeError(w, "failed to create config dir", http.StatusInternalServerError)
		return
	}
	if err := os.WriteFile(networkConfigPath(), data, 0o600); err != nil {
		writeError(w, "failed to save config", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]bool{"ok": true})
}
