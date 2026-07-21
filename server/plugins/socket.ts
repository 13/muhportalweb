import type { Server } from 'node:http'
import { createMqttBridge } from '../utils/mqttBridge'
import { debugLog } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  debugLog.log('Setting up Socket.IO and MQTT bridge...')

  const bridge = createMqttBridge({
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://192.168.22.5:1883',
    corsOrigins: (process.env.CORS_ORIGINS ?? '').split(','),
    allowReconfigure: process.env.ALLOW_MQTT_RECONFIGURE === 'true',
    authToken: process.env.AUTH_TOKEN || undefined,
    allowLocalhostOrigins: process.env.NODE_ENV !== 'production',
  })

  bridge.connectMqtt()

  nitroApp.hooks.hookOnce('request', (event) => {
    // res.socket is typed as net.Socket, but for HTTP connections it carries
    // a reference to the listening http.Server
    const httpServer = (event.node.res.socket as { server?: Server } | null)?.server
    if (!bridge.isAttached && httpServer) {
      bridge.attach(httpServer)
    }
  })

  nitroApp.hooks.hook('close', () => {
    bridge.close()
  })
})
