package api

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

)

type DeviceInfo struct {
	Serial      string `json:"serial"`
	Version     string `json:"version"`
	Name        string `json:"name"`
	Configured  bool   `json:"configured"`
	PinRequired bool   `json:"pinRequired"`
	Activated   bool   `json:"activated"`
}

const firmwareVersion = "1.0.0"

// FirmwareVersion is the exported form for use outside this package.
const FirmwareVersion = firmwareVersion

// GetOrCreateSerial is the exported form for use outside this package.
func GetOrCreateSerial() string { return getOrCreateSerial() }

// WriteProvisioningPin writes a remotely-issued PIN to the local pin file
// so the next user activation will require it.
func WriteProvisioningPin(pin string) error {
	os.MkdirAll(dataDir(), 0755)
	return os.WriteFile(pinPath(), []byte(strings.TrimSpace(pin)), 0644)
}

// DataDir returns the directory used for persistent device state files.
func DataDir() string { return dataDir() }

func dataDir() string {
	if d := os.Getenv("CARDBRIDGE_DATA_DIR"); d != "" {
		return d
	}
	return "/var/lib/cardbridge"
}

// getOrCreateSerial reads the persisted serial or generates a new one.
func getOrCreateSerial() string {
	path := filepath.Join(dataDir(), "serial")
	data, err := os.ReadFile(path)
	if err == nil {
		s := strings.TrimSpace(string(data))
		if s != "" {
			return s
		}
	}
	b := make([]byte, 3)
	rand.Read(b)
	serial := "CB-" + strings.ToUpper(hex.EncodeToString(b))
	os.MkdirAll(dataDir(), 0755)
	os.WriteFile(path, []byte(serial), 0644)
	return serial
}

func getDeviceName() string {
	path := filepath.Join(dataDir(), "device-name")
	data, err := os.ReadFile(path)
	if err == nil {
		if name := strings.TrimSpace(string(data)); name != "" {
			return name
		}
	}
	return "My CardBridge"
}

func pinPath() string { return filepath.Join(dataDir(), "pin") }

// hasPendingPin returns true when the unit was factory-provisioned with an
// activation PIN that has not yet been consumed.
func hasPendingPin() bool {
	data, err := os.ReadFile(pinPath())
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(data)) != ""
}

// validateAndConsumePin checks the submitted PIN against the stored one.
// On success it deletes the PIN file so it can only be used once.
func validateAndConsumePin(submitted string) bool {
	data, err := os.ReadFile(pinPath())
	if err != nil {
		return false
	}
	stored := strings.TrimSpace(string(data))
	if stored == "" || !strings.EqualFold(stored, strings.TrimSpace(submitted)) {
		return false
	}
	os.Remove(pinPath())
	return true
}

// isConfigured returns true once the user has completed the setup wizard
// (home WiFi saved = setup done).
func isConfigured() bool {
	path := filepath.Join(dataDir(), "network.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return false
	}
	var cfg struct {
		HomeSSID string `json:"homeSsid"`
	}
	if err := json.Unmarshal(data, &cfg); err != nil {
		return false
	}
	return cfg.HomeSSID != ""
}

// getUnitOwner returns the owner user ID recorded at activation time, if any.
func getUnitOwner(db *sql.DB, serial string) (ownerID string, ok bool) {
	err := db.QueryRow(`SELECT owner_id FROM units WHERE serial = ?`, serial).Scan(&ownerID)
	return ownerID, err == nil
}

// RequireUnitOwner is a middleware that, once the unit has been claimed,
// rejects requests from any JWT that is not the registered owner.
// If the unit has never been activated it allows all authenticated requests through.
func (h *Handler) RequireUnitOwner(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serial := getOrCreateSerial()
		ownerID, hasOwner := getUnitOwner(h.db, serial)
		if !hasOwner {
			next.ServeHTTP(w, r)
			return
		}
		claims := claimsFromCtx(r)
		if claims.Subject != ownerID {
			http.Error(w, `{"error":"forbidden: unit is registered to another account"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// GetDeviceInfo is public (no JWT) — used by the setup wizard before auth.
func (h *Handler) GetDeviceInfo(w http.ResponseWriter, r *http.Request) {
	serial := getOrCreateSerial()
	_, activated := getUnitOwner(h.db, serial)
	info := DeviceInfo{
		Serial:      serial,
		Version:     firmwareVersion,
		Name:        getDeviceName(),
		Configured:  isConfigured(),
		PinRequired: hasPendingPin(),
		Activated:   activated,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

// ActivateDevice is protected (JWT required) — validates the factory PIN and
// binds the unit to the authenticated user's account.
// The PIN is single-use: it is deleted on first successful validation.
// Dev/unprovisioned units (no pin file) are handled gracefully.
func (h *Handler) ActivateDevice(w http.ResponseWriter, r *http.Request) {
	claims := claimsFromCtx(r)
	serial := getOrCreateSerial()

	if !hasPendingPin() {
		// Unit has no pending PIN — either unprovisioned (dev) or already activated.
		ownerID, hasOwner := getUnitOwner(h.db, serial)
		if hasOwner && ownerID != claims.Subject {
			http.Error(w, `{"error":"unit already registered to another account"}`, http.StatusConflict)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"ok":true}`))
		return
	}

	var body struct {
		Pin string `json:"pin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Pin) == "" {
		http.Error(w, `{"error":"pin required"}`, http.StatusBadRequest)
		return
	}
	if !validateAndConsumePin(body.Pin) {
		http.Error(w, `{"error":"invalid pin"}`, http.StatusUnauthorized)
		return
	}

	if _, err := h.db.ExecContext(r.Context(),
		`INSERT OR IGNORE INTO units (serial, owner_id) VALUES (?, ?)`,
		serial, claims.Subject,
	); err != nil {
		http.Error(w, `{"error":"internal error"}`, http.StatusInternalServerError)
		return
	}


	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"ok":true}`))
}

// SetDeviceName saves the unit name chosen during setup (JWT required).
func (h *Handler) SetDeviceName(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Name) == "" {
		http.Error(w, "invalid name", http.StatusBadRequest)
		return
	}
	path := filepath.Join(dataDir(), "device-name")
	os.MkdirAll(dataDir(), 0755)
	if err := os.WriteFile(path, []byte(strings.TrimSpace(body.Name)), 0644); err != nil {
		http.Error(w, "failed to save", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"ok":true}`))
}
