# MuhPortalWeb

**MUH Portal Web** - Home Automation Frontend

A modern home automation frontend built with Nuxt 4, Vue 3, Vuetify 3, and MQTT

## Contents

 * [Screenshots](#screenshots)
 * [Features](#features)
 * [Installation](#installation)
 * [Configuration](#configuration)
 * [MQTT Topics](#mqtt-topics)

## Screenshots

<p align="center">
  <img src="assets/screenshot1.png" width="200" />
  <img src="assets/screenshot2.png" width="200" />
  <img src="assets/screenshot3.png" width="200" />
</p>

## Features

 * Display garage & doors status
 * Control garage & doors
 * List servers & Wake-on-LAN
 * Shutdown servers via MQTT
  
### Technology Stack

 * Nuxt 4
 * Vue 3
 * Vuetify 3
 * MQTT (direct browser WebSocket connection)

## Installation

### Prerequisites

Install Node.js 20+ and an MQTT broker with WebSocket support enabled (e.g., Mosquitto with WebSocket listener).

### Development

```bash
# Clone repository
git clone https://github.com/13/muhportalweb.git
cd muhportalweb

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production

```bash
# Build for production
npm run build

# Start production server
node .output/server/index.mjs

# Or preview production build
npm run preview

# Or use Docker
docker compose up
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
# MQTT WebSocket URL (browser connects directly to this)
MQTT_WS_URL=ws://192.168.22.5:1884

# Nuxt server configuration
NUXT_HOST=0.0.0.0
NUXT_PORT=3000
```

### HTTPS with nginx-proxy (Self-Signed Certificate)

When running behind an HTTPS reverse proxy (e.g., nginx-proxy with self-signed certificates), you **must** use secure WebSocket (`wss://`) to avoid mixed content errors:

```bash
# Use wss:// for HTTPS deployments
MQTT_WS_URL=wss://mqtt.yourdomain.com:8884
```

**Note:** Your MQTT broker must be configured with TLS/SSL support on the WebSocket port. For Mosquitto, add to your config:

```
listener 8884
protocol websockets
certfile /path/to/cert.pem
keyfile /path/to/key.pem
```

## MQTT Topics

### Portal (Doors/Locks)

**Subscribe:** `muh/portal/+/json`
- Topics: `G` (Garage), `GD` (Garage Door), `GDL` (Garage Door Lock), `HD` (House Door), `HDL` (House Door Lock)
- Payload: `{"state": 1, "time": "2026-01-24T09:23:16"}`

**Publish:** `muh/portal/RLY/cmnd`
- Payload: `<portal>_<action>` (e.g., `G_T`, `HD_O`, `HDL_L`)
- Actions: `T` (Toggle/Move), `O` (Open), `L` (Lock), `U` (Unlock)

### WOL (Wake-on-LAN)

**Subscribe:** `muh/pc/#`
- Payload: `{"name":"server.local","ip":"192.168.1.100","mac":"00:11:22:33:44:55","alive":false,"priority":1}`

**Publish:** 
- Wake: `muh/wol` with `{"mac":"00:11:22:33:44:55"}`
- Shutdown: `muh/poweroff` with `{"mac":"00:11:22:33:44:55"}`
