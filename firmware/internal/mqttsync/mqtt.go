package mqttsync

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// Client wraps paho MQTT with CardBridge-specific publish helpers.
type Client struct {
	mc     mqtt.Client
	serial string
}

// Connect creates and connects an MQTT client for the given serial number.
// It registers a Last Will so Home Assistant detects when the device goes offline.
func Connect(serial, broker, user, pass string) (*Client, error) {

	statusTopic := fmt.Sprintf("cardbridge/%s/status", serial)

	opts := mqtt.NewClientOptions().
		AddBroker(broker).
		SetClientID("cardbridge-" + serial).
		SetUsername(user).
		SetPassword(pass).
		SetWill(statusTopic, "offline", 1, true).
		SetCleanSession(false).
		SetAutoReconnect(true).
		SetOnConnectHandler(func(c mqtt.Client) {
			log.Printf("MQTT: connected to %s", broker)
			c.Publish(statusTopic, 1, true, "online")
		}).
		SetConnectionLostHandler(func(_ mqtt.Client, err error) {
			log.Printf("MQTT: connection lost: %v", err)
		})

	mc := mqtt.NewClient(opts)
	if tok := mc.Connect(); tok.WaitTimeout(10*time.Second) && tok.Error() != nil {
		return nil, tok.Error()
	}
	return &Client{mc: mc, serial: serial}, nil
}

// AnnounceDiscovery publishes Home Assistant MQTT Discovery payloads so
// CardBridge entities appear automatically in HA without manual config.
func (c *Client) AnnounceDiscovery() {
	dev := map[string]any{
		"identifiers":  []string{"cardbridge_" + c.serial},
		"name":         "CardBridge " + c.serial,
		"manufacturer": "CardBridge",
		"model":        "CardBridge",
	}

	entities := []struct {
		component string
		id        string
		payload   map[string]any
	}{
		{
			component: "binary_sensor",
			id:        c.serial + "_status",
			payload: map[string]any{
				"name":           "Status",
				"unique_id":      "cardbridge_" + c.serial + "_status",
				"state_topic":    fmt.Sprintf("cardbridge/%s/status", c.serial),
				"payload_on":     "online",
				"payload_off":    "offline",
				"device_class":   "connectivity",
				"device":         dev,
			},
		},
		{
			component: "sensor",
			id:        c.serial + "_last_clip",
			payload: map[string]any{
				"name":           "Last Clip",
				"unique_id":      "cardbridge_" + c.serial + "_last_clip",
				"state_topic":    fmt.Sprintf("cardbridge/%s/clips/new", c.serial),
				"value_template": "{{ value_json.name }}",
				"icon":           "mdi:video",
				"device":         dev,
			},
		},
		{
			component: "sensor",
			id:        c.serial + "_storage",
			payload: map[string]any{
				"name":                "Storage Used",
				"unique_id":           "cardbridge_" + c.serial + "_storage",
				"state_topic":         fmt.Sprintf("cardbridge/%s/storage", c.serial),
				"value_template":      "{{ value_json.percent }}",
				"unit_of_measurement": "%",
				"icon":                "mdi:harddisk",
				"device":              dev,
			},
		},
		{
			component: "sensor",
			id:        c.serial + "_clips_today",
			payload: map[string]any{
				"name":           "Clips Today",
				"unique_id":      "cardbridge_" + c.serial + "_clips_today",
				"state_topic":    fmt.Sprintf("cardbridge/%s/stats", c.serial),
				"value_template": "{{ value_json.clips_today }}",
				"icon":           "mdi:counter",
				"device":         dev,
			},
		},
	}

	for _, e := range entities {
		topic := fmt.Sprintf("homeassistant/%s/%s/config", e.component, e.id)
		b, _ := json.Marshal(e.payload)
		c.mc.Publish(topic, 1, true, b)
	}

	// Device trigger — lets HA automations fire on "new clip synced"
	triggerPayload, _ := json.Marshal(map[string]any{
		"automation_type": "trigger",
		"topic":           fmt.Sprintf("cardbridge/%s/clips/new", c.serial),
		"type":            "new_clip",
		"subtype":         "new_clip",
		"payload":         "",
		"device":          dev,
	})
	c.mc.Publish(
		fmt.Sprintf("homeassistant/device_automation/cardbridge_%s_new_clip/config", c.serial),
		1, true, triggerPayload,
	)

	log.Printf("MQTT: HA discovery published for %s", c.serial)
}

// PublishClip notifies Home Assistant that a new clip was synced.
func (c *Client) PublishClip(deviceID, name string, size int64, duration int) {
	payload, _ := json.Marshal(map[string]any{
		"device":   deviceID,
		"name":     name,
		"size":     size,
		"duration": duration,
		"time":     time.Now().UTC().Format(time.RFC3339),
	})
	c.mc.Publish(fmt.Sprintf("cardbridge/%s/clips/new", c.serial), 1, false, payload)
}

// PublishStorage reports current storage usage as a percentage.
func (c *Client) PublishStorage(usedBytes, totalBytes int64) {
	if totalBytes == 0 {
		return
	}
	pct := int(usedBytes * 100 / totalBytes)
	payload, _ := json.Marshal(map[string]any{
		"used_bytes":  usedBytes,
		"total_bytes": totalBytes,
		"free_bytes":  totalBytes - usedBytes,
		"percent":     pct,
	})
	c.mc.Publish(fmt.Sprintf("cardbridge/%s/storage", c.serial), 1, true, payload)
}

// PublishStats reports aggregate stats (clips synced today, total devices).
func (c *Client) PublishStats(clipsToday, totalDevices int) {
	payload, _ := json.Marshal(map[string]any{
		"clips_today":   clipsToday,
		"total_devices": totalDevices,
	})
	c.mc.Publish(fmt.Sprintf("cardbridge/%s/stats", c.serial), 1, true, payload)
}

// Disconnect cleanly disconnects from the broker.
func (c *Client) Disconnect() {
	c.mc.Publish(fmt.Sprintf("cardbridge/%s/status", c.serial), 1, true, "offline")
	c.mc.Disconnect(500)
}
