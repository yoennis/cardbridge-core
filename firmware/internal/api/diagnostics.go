package api

import (
	"bufio"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type diagIface struct {
	Name      string `json:"name"`
	IP        string `json:"ip,omitempty"`
	Connected bool   `json:"connected"`
}

type diagMount struct {
	Device     string `json:"device"`
	Mountpoint string `json:"mountpoint"`
	Fstype     string `json:"fstype"`
	UsedBytes  int64  `json:"usedBytes"`
	TotalBytes int64  `json:"totalBytes"`
}

type diagService struct {
	Name   string `json:"name"`
	Active bool   `json:"active"`
}

type DiagnosticsResponse struct {
	Timestamp   time.Time     `json:"timestamp"`
	Serial      string        `json:"serial"`
	Version     string        `json:"version"`
	Uptime      string        `json:"uptime"`
	Interfaces  []diagIface   `json:"interfaces"`
	Mounts      []diagMount   `json:"mounts"`
	Services    []diagService `json:"services"`
	RecentLogs  []string      `json:"recentLogs"`
}

func (h *Handler) GetDiagnostics(w http.ResponseWriter, r *http.Request) {
	diag := DiagnosticsResponse{
		Timestamp:  time.Now(),
		Serial:     getOrCreateSerial(),
		Version:    firmwareVersion,
		Uptime:     readUptime(),
		Interfaces: readInterfaces(),
		Mounts:     readMounts(h.store.StoragePath()),
		Services:   checkServices([]string{"cardbridge", "hostapd", "dnsmasq", "avahi-daemon"}),
		RecentLogs: readRecentLogs(50),
	}
	writeJSON(w, diag)
}

// ── helpers ───────────────────────────────────────────────────────────────────

func readUptime() string {
	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return "unknown"
	}
	parts := strings.Fields(string(data))
	if len(parts) == 0 {
		return "unknown"
	}
	secs, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return "unknown"
	}
	d := time.Duration(secs) * time.Second
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	if h > 0 {
		return fmt.Sprintf("%dh %dm %ds", h, m, s)
	}
	return fmt.Sprintf("%dm %ds", m, s)
}

func readInterfaces() []diagIface {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil
	}
	var result []diagIface
	for _, iface := range ifaces {
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		di := diagIface{
			Name:      iface.Name,
			Connected: iface.Flags&net.FlagUp != 0,
		}
		addrs, _ := iface.Addrs()
		for _, a := range addrs {
			if ipnet, ok := a.(*net.IPNet); ok && ipnet.IP.To4() != nil {
				di.IP = ipnet.IP.String()
				break
			}
		}
		result = append(result, di)
	}
	return result
}

func readMounts(storagePath string) []diagMount {
	entries, err := os.ReadDir(storagePath)
	if err != nil {
		return nil
	}
	var result []diagMount
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		mp := filepath.Join(storagePath, e.Name())
		var stat syscall.Statfs_t
		if err := syscall.Statfs(mp, &stat); err != nil {
			continue
		}
		total := int64(stat.Blocks) * int64(stat.Bsize)
		free := int64(stat.Bfree) * int64(stat.Bsize)
		if total == 0 {
			continue
		}
		result = append(result, diagMount{
			Device:     e.Name(),
			Mountpoint: mp,
			UsedBytes:  total - free,
			TotalBytes: total,
		})
	}
	return result
}

func checkServices(names []string) []diagService {
	var result []diagService
	for _, name := range names {
		out, err := exec.Command("systemctl", "is-active", "--quiet", name).CombinedOutput()
		_ = out
		result = append(result, diagService{
			Name:   name,
			Active: err == nil,
		})
	}
	return result
}

func readRecentLogs(n int) []string {
	// Try journalctl first (systemd), fall back to /var/log/syslog
	out, err := exec.Command("journalctl", "-u", "cardbridge", "-n", strconv.Itoa(n), "--no-pager", "--output=short").Output()
	if err == nil && len(out) > 0 {
		return splitLines(string(out), n)
	}
	f, err := os.Open("/var/log/syslog")
	if err != nil {
		return nil
	}
	defer f.Close()
	var lines []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return lines
}

func splitLines(s string, max int) []string {
	var lines []string
	for _, l := range strings.Split(strings.TrimSpace(s), "\n") {
		if l != "" {
			lines = append(lines, l)
		}
	}
	if len(lines) > max {
		lines = lines[len(lines)-max:]
	}
	return lines
}
