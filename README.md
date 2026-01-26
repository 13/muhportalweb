# MuhPortalWeb

**MUH Portal Web** - Home Automation Frontend

A modern home automation frontend built with Nuxt 4, Vue 3, Vuetify 3, and MQTT

## Contents

 * [Screenshots](#screenshots)
 * [Features](#features)
 * [Architecture](#architecture)
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
 * MQTT (backend connection with WebSocket bridge to frontend)
 * WebSocket (real-time communication between frontend and backend)

## Architecture

The application uses a **backend MQTT client** with a **WebSocket bridge** to the frontend:

1. **Backend (Nuxt/Nitro Server)**:
   - Maintains a persistent MQTT connection to the broker
   - Handles MQTT subscriptions and publishes
   - Provides WebSocket endpoint at `/api/mqtt-ws`

2. **Frontend (Vue/Nuxt Client)**:
   - Connects to backend via WebSocket
   - Receives MQTT messages forwarded by the backend
   - Sends publish requests to the backend

This architecture provides:
- Better connection management (single MQTT connection)
- Improved security (MQTT credentials only on backend)
- Easier deployment (no need for MQTT WebSocket support on broker)

## Installation

### Prerequisites

Install Node.js 20+ and an MQTT broker (e.g., Mosquitto).

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
# MQTT Broker URL (backend connects to this)
MQTT_BROKER_URL=mqtt://192.168.22.5:1883

# Nuxt server configuration
NUXT_HOST=0.0.0.0
NUXT_PORT=3000
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
