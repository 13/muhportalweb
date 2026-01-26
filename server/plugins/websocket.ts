import { WebSocketServer, WebSocket } from 'ws'

let wss: WebSocketServer | null = null

export default defineNitroPlugin((nitroApp) => {
  // Only run on Node.js server
  if (import.meta.dev || process.env.NODE_ENV !== 'production') {
    console.log('[WebSocket Plugin] Initializing in development mode')
  }

  // Hook into Nitro's lifecycle to get the HTTP server
  nitroApp.hooks.hook('listen', (listenerServer) => {
    if (!listenerServer) {
      console.error('[WebSocket] No server available')
      return
    }

    // Create WebSocket server
    wss = new WebSocketServer({ noServer: true })

    // Handle upgrade requests
    listenerServer.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`)
      
      if (url.pathname === '/api/mqtt-ws') {
        wss?.handleUpgrade(request, socket, head, (ws) => {
          wss?.emit('connection', ws, request)
        })
      } else {
        socket.destroy()
      }
    })

    // Handle WebSocket connections
    wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Client connected')

      const mqttManager = getMqttManager()

      // Track subscriptions for this client
      const clientSubscriptions = new Map<string, (topic: string, message: Buffer) => void>()

      // Send connection status
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        mqttConnected: mqttManager.getConnectionStatus(),
      }))

      // Handle messages from client
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())

          switch (message.type) {
            case 'subscribe':
              if (message.topic) {
                console.log('[WebSocket] Client subscribing to:', message.topic)
                
                // Create a callback that forwards MQTT messages to this WebSocket client
                const callback = (topic: string, mqttMessage: Buffer) => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                      type: 'message',
                      topic,
                      payload: mqttMessage.toString(),
                    }))
                  }
                }

                // Store the callback so we can unsubscribe later
                clientSubscriptions.set(message.topic, callback)
                
                // Subscribe to MQTT topic
                mqttManager.subscribe(message.topic, callback)
              }
              break

            case 'unsubscribe':
              if (message.topic) {
                console.log('[WebSocket] Client unsubscribing from:', message.topic)
                
                const callback = clientSubscriptions.get(message.topic)
                if (callback) {
                  mqttManager.unsubscribe(message.topic, callback)
                  clientSubscriptions.delete(message.topic)
                }
              }
              break

            case 'publish':
              if (message.topic && message.payload) {
                console.log('[WebSocket] Client publishing to:', message.topic)
                mqttManager.publish(message.topic, message.payload)
              }
              break

            case 'ping':
              ws.send(JSON.stringify({
                type: 'pong',
                mqttConnected: mqttManager.getConnectionStatus(),
              }))
              break

            default:
              console.warn('[WebSocket] Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('[WebSocket] Error processing message:', error)
        }
      })

      // Handle client disconnect
      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected')
        
        // Unsubscribe from all MQTT topics
        clientSubscriptions.forEach((callback, topic) => {
          mqttManager.unsubscribe(topic, callback)
        })
        clientSubscriptions.clear()
      })

      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error)
      })
    })

    console.log('[WebSocket] Server initialized on path: /api/mqtt-ws')
  })
})
