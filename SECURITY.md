# Security

CardBridge Core is a local-first system. All data stays on your network.
This document describes the security model and what you need to configure before
running in any non-development environment.

---

## Architecture

| Component | Where it runs | Network exposure |
|-----------|--------------|-----------------|
| Go firmware | Raspberry Pi | Local network only (home WiFi or AP hotspot) |
| React PWA | Browser | Served from the Pi, no external CDN |
| SQLite database | Pi filesystem | Not exposed over the network |
| Media files | Pi filesystem | Served only to authenticated users |

CardBridge Core makes **no outbound network calls** to external servers by default.
The only external connections are optional: MQTT broker (if configured) and WiFi SD card polling (if enabled).

---

## Required: change before deploying

### JWT secret

The default `CARDBRIDGE_JWT_SECRET=change-me` is **insecure and must be changed** before
any non-development use.

```bash
# Generate a secure secret (run on your Pi or Mac/Linux):
openssl rand -hex 32

# Set in /opt/cardbridge/.env on the Pi:
CARDBRIDGE_JWT_SECRET=<your-generated-secret>
```

If this secret is compromised, all existing sessions are invalidated when you rotate it.
There is no other impact — no external system has access to it.

### WiFi AP password

The default AP credentials are `CardBridge` / `cardbridge`. Change them via the settings
screen or by editing the hostapd config directly on the Pi.

---

## Authentication

- All API endpoints (except `/health`, `/api/auth/register`, `/api/auth/login`) require a JWT.
- Tokens are HS256, signed with `CARDBRIDGE_JWT_SECRET`.
- There is no token refresh mechanism — tokens expire and the user logs in again.
- Registration creates the first user account; subsequent registrations are open unless
  you restrict access at the network level.

**Network-level recommendation:** CardBridge is designed to be on your home LAN only.
Do not expose port 8080 to the internet without additional authentication (e.g. VPN, reverse
proxy with authentication).

---

## Media file access

- Media files are served via `/api/devices/:id/clips/:id/stream` with HTTP range request support.
- All stream endpoints require a valid JWT.
- Files are read from the configured `CARDBRIDGE_STORAGE_PATH` directory. The server does not
  traverse outside this root.

---

## WiFi SD card polling (experimental)

When `CARDBRIDGE_WIFISD_HOST` is set, the server makes outbound HTTP requests to that IP
every 30 seconds. This is the only outbound traffic. The card's IP must be on your local
network — CardBridge does not route this through any external service.

---

## Push notifications (VAPID)

- Web push uses VAPID (Voluntary Application Server Identification).
- VAPID keys are generated locally on first run and stored in the data directory.
- Push notifications go through browser push services (Google FCM, Apple APNs) — this is
  the only data that leaves the local network, and it contains only: device name, clip count.
  No video data, no file paths, no user identifiers are sent.

---

## Reporting a vulnerability

If you find a security issue, contact directly via email (see README). Please do not open
a public GitHub issue for security vulnerabilities. We'll respond within 48 hours.
