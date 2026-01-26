import { Server as SocketIOServer } from 'socket.io'
import { mqttManager } from '../utils/mqttManager'
import type { Server } from 'http'

// Extend Server type to include Socket.IO server
interface ServerWithSocketIO extends Server {
  io?: SocketIOServer
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  
  // Initialize MQTT manager on first request
  const mqttUrl = config.mqttUrl || process.env.MQTT_URL || 'mqtt://192.168.22.5:1883'
  mqttManager.initialize(mqttUrl)

  // Get or create Socket.IO server
  const server = event.node.res.socket?.server as ServerWithSocketIO | undefined
  if (!server) {
    return
  }

  // Create Socket.IO server if it doesn't exist
  if (!server.io) {
    console.log('[Socket.IO] Creating Socket.IO server')
    const io = new SocketIOServer(server, {
      path: '/socket.io',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })

    io.on('connection', (socket) => {
      console.log('[Socket.IO] New client connected:', socket.id)
      mqttManager.addClient(socket)

      // Send connection status
      socket.emit('connected', {
        mqttConnected: mqttManager.getConnectionStatus(),
      })

      socket.on('subscribe', (data: { topic: string }) => {
        console.log('[Socket.IO] Subscribe request:', data)
        mqttManager.subscribe(data.topic, socket)
      })

      socket.on('publish', (data: { topic: string, payload: string }) => {
        console.log('[Socket.IO] Publish request:', data)
        mqttManager.publish(data.topic, data.payload)
      })

      socket.on('disconnect', () => {
        console.log('[Socket.IO] Client disconnected:', socket.id)
        mqttManager.removeClient(socket)
      })
    })

    server.io = io
  }
})
