package config

import "os"

type Config struct {
	StoragePath  string
	Port         string
	AppOrigin    string
	JWTSecret    string
	DBPath       string
	WifiSDHost   string // optional: IP or hostname of WiFi SD card
	WifiSDType   string // "flashair" or "ezshare"
	MQTTBroker   string // optional: e.g. "tcp://192.168.1.10:1883"
	MQTTUser     string
	MQTTPassword string
}

func Load() Config {
	return Config{
		StoragePath:  getenv("CARDBRIDGE_STORAGE_PATH", "../mock-data"),
		Port:         getenv("CARDBRIDGE_PORT", "8080"),
		AppOrigin:    getenv("CARDBRIDGE_APP_ORIGIN", "http://localhost:5173"),
		JWTSecret:    getenv("CARDBRIDGE_JWT_SECRET", "change-me-in-production"),
		DBPath:       getenv("CARDBRIDGE_DB_PATH", "./cardbridge.db"),
		WifiSDHost:   getenv("CARDBRIDGE_WIFISD_HOST", ""),
		WifiSDType:   getenv("CARDBRIDGE_WIFISD_TYPE", "flashair"),
		MQTTBroker:   getenv("MQTT_BROKER", ""),
		MQTTUser:     getenv("MQTT_USER", ""),
		MQTTPassword: getenv("MQTT_PASSWORD", ""),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
