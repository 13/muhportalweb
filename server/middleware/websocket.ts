import { WebSocketServer, WebSocket } from 'ws'
import { mqttManager } from '../utils/mqttManager'

export default defineEventHandler((event) => {
  // Skip for non-upgrade requests
  if (!event.node.req.headers.upgrade) {
    return
  }

  const config = useRuntimeConfig()
  
  // Initialize MQTT manager on first request
  const mqttUrl = config.mqttUrl || process.env.MQTT_URL || 'mqtt://192.168.22.5:1883'
  mqttManager.initialize(mqttUrl)

  // Get or create WebSocket server
  const server = event.node.res.socket?.server
  if (!server) {
    console.error('[WebSocket] Server not available')
    return
  }

  // Create WebSocket server if it doesn't exist
  if (!(server as any).wss) {
    console.log('[WebSocket] Creating WebSocket server')
    const wss = new WebSocketServer({ noServer: true })

    wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] New client connected')
      mqttManager.addClient(ws)

      // Send connection status
      ws.send(JSON.stringify({
        type: 'connected',
        mqttConnected: mqttManager.getConnectionStatus(),
      }))

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          console.log('[WebSocket] Received message:', message)

          switch (message.type) {
            case 'subscribe':
              mqttManager.subscribe(message.topic, ws)
              break
            case 'publish':
              mqttManager.publish(message.topic, message.payload)
              break
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }))
              break
          }
        } catch (err) {
          console.error('[WebSocket] Error processing message:', err)
        }
      })

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected')
        mqttManager.removeClient(ws)
      })

      ws.on('error', (err) => {
        console.error('[WebSocket] WebSocket error:', err)
        mqttManager.removeClient(ws)
      })
    })

    server.on('upgrade', (request, socket, head) => {
      console.log('[WebSocket] Upgrade request for:', request.url)
      if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request)
        })
      } else {
        socket.destroy()
      }
    })

    ;(server as any).wss = wss
  }
})
