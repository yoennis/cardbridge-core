package api

import (
	"encoding/json"
	"net/http"

	"github.com/yoennis/cardbridge-core/internal/mqttsync"
)

type mqttConfigRequest struct {
	Broker   string `json:"broker"`
	User     string `json:"user"`
	Password string `json:"password"`
}

type mqttStatusResponse struct {
	Configured bool   `json:"configured"`
	Connected  bool   `json:"connected"`
	Broker     string `json:"broker"`
	User       string `json:"user"`
}

// GetMQTTConfig returns the current MQTT config and connection status.
func (h *Handler) GetMQTTConfig(w http.ResponseWriter, r *http.Request) {
	if h.mqtt == nil {
		writeJSON(w, mqttStatusResponse{})
		return
	}
	cfg, configured := h.mqtt.Config()
	writeJSON(w, mqttStatusResponse{
		Configured: configured,
		Connected:  h.mqtt.Connected(),
		Broker:     cfg.Broker,
		User:       cfg.User,
		// Password intentionally omitted from response
	})
}

// SetMQTTConfig saves config and hot-reconnects to the broker.
func (h *Handler) SetMQTTConfig(w http.ResponseWriter, r *http.Request) {
	if h.mqtt == nil {
		writeError(w, "MQTT manager not available", http.StatusServiceUnavailable)
		return
	}
	var req mqttConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Broker == "" {
		writeError(w, "broker is required", http.StatusBadRequest)
		return
	}
	if err := h.mqtt.Reconnect(mqttsync.Config{
		Broker:   req.Broker,
		User:     req.User,
		Password: req.Password,
	}); err != nil {
		writeError(w, "failed to connect: "+err.Error(), http.StatusBadGateway)
		return
	}
	writeJSON(w, map[string]any{"ok": true, "connected": h.mqtt.Connected()})
}

// DeleteMQTTConfig disconnects and clears the saved MQTT config.
func (h *Handler) DeleteMQTTConfig(w http.ResponseWriter, r *http.Request) {
	if h.mqtt == nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	_ = h.mqtt.Reconnect(mqttsync.Config{}) // empty broker = disconnect
	w.WriteHeader(http.StatusNoContent)
}
