import { Server as SocketIOServer } from 'socket.io'
import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import type { Server } from 'node:http'

// Store subscriptions and handlers
interface MqttSubscription {
  topic: string
  clients: Set<string> // Socket IDs
}

const subscriptions = new Map<string, MqttSubscription>()
let mqttClient: MqttClient | null = null
let io: SocketIOServer | null = null
let isInitializing = false

// Helper function to check if topic matches wildcard pattern
function topicMatchesPattern(pattern: string, topic: string): boolean {
  const wildcardPattern = pattern.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
  return new RegExp(`^${wildcardPattern}$`).test(topic)
}

function setupSocketIO(server: Server) {
  if (io || isInitializing) return // Prevent race conditions
  isInitializing = true
  
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true)
        
        // In development, allow any localhost origin
        if (process.env.NODE_ENV !== 'production' && (origin?.includes('localhost') || origin?.includes('127.0.0.1'))) {
          return callback(null, true)
        }
        
        // Check against allowed origins
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
  })

  io.on('connection', (socket) => {
    console.log('Socket.IO: Client connected:', socket.id)

    socket.on('mqtt-subscribe', (data: { topic: string }) => {
      const { topic } = data
      console.log('Socket.IO: Client', socket.id, 'subscribing to:', topic)

      // Add client to subscription
      if (!subscriptions.has(topic)) {
        subscriptions.set(topic, {
          topic,
          clients: new Set(),
        })
        // Subscribe to MQTT topic if this is the first client
        console.log('Socket.IO: First subscription to', topic, '- subscribing to MQTT broker')
        mqttClient?.subscribe(topic, (err) => {
          if (err) {
            console.error('MQTT: Subscribe error for topic', topic, ':', err)
            socket.emit('mqtt-error', { error: 'Failed to subscribe to topic' })
          } else {
            console.log('MQTT: Successfully subscribed to topic:', topic)
          }
        })
      } else {
        console.log('Socket.IO: Adding client to existing subscription for:', topic)
      }
      subscriptions.get(topic)?.clients.add(socket.id)
      console.log('Socket.IO: Total clients subscribed to', topic, ':', subscriptions.get(topic)?.clients.size)
    })

    socket.on('mqtt-publish', (data: { topic: string; payload: string }) => {
      const { topic, payload } = data
      console.log('Socket.IO: Client publishing to:', topic, payload)
      
      if (mqttClient) {
        mqttClient.publish(topic, payload)
      } else {
        socket.emit('mqtt-error', { error: 'MQTT client not connected' })
      }
    })

    socket.on('disconnect', () => {
      console.log('Socket.IO: Client disconnected:', socket.id)
      
      // Remove client from all subscriptions
      subscriptions.forEach((sub, topic) => {
        sub.clients.delete(socket.id)
        
        // Unsubscribe from MQTT if no more clients
        if (sub.clients.size === 0) {
          mqttClient?.unsubscribe(topic)
          subscriptions.delete(topic)
        }
      })
    })
  })

  console.log('Socket.IO server initialized')
  isInitializing = false
}

export default defineNitroPlugin((nitroApp) => {
  // Get MQTT broker URL from environment
  const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.22.5:1883'
  
  console.log('Setting up Socket.IO and MQTT bridge...')
  console.log('MQTT Broker URL:', mqttBrokerUrl)

  // Initialize MQTT client
  mqttClient = mqtt.connect(mqttBrokerUrl)

  mqttClient.on('connect', () => {
    console.log('MQTT: Connected to broker')
  })

  mqttClient.on('close', () => {
    console.log('MQTT: Disconnected from broker')
  })

  mqttClient.on('error', (err) => {
    console.error('MQTT: Connection error:', err)
  })

  mqttClient.on('message', (topic: string, message: Buffer) => {
    console.log('MQTT: Received message on topic:', topic, 'Content:', message.toString())
    
    // Forward MQTT messages to all subscribed Socket.IO clients
    const subscription = subscriptions.get(topic)
    if (subscription && io) {
      console.log('MQTT: Forwarding to', subscription.clients.size, 'client(s) subscribed to exact topic:', topic)
      subscription.clients.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.emit('mqtt-message', {
            topic,
            message: message.toString(),
          })
        }
      })
    }

    // Also check for wildcard subscriptions
    subscriptions.forEach((sub, subTopic) => {
      if (subTopic !== topic && topicMatchesPattern(subTopic, topic)) {
        console.log('MQTT: Forwarding to', sub.clients.size, 'client(s) via wildcard subscription:', subTopic)
        sub.clients.forEach((socketId) => {
          const socket = io?.sockets.sockets.get(socketId)
          if (socket) {
            socket.emit('mqtt-message', {
              topic,
              message: message.toString(),
            })
          }
        })
      }
    })
  })

  // Try to initialize Socket.IO when server is ready
  nitroApp.hooks.hookOnce('request', (event) => {
    if (!io && event.node.res.socket?.server) {
      setupSocketIO(event.node.res.socket.server)
    }
  })

  // Cleanup on shutdown
  nitroApp.hooks.hook('close', () => {
    if (mqttClient) {
      mqttClient.end()
      mqttClient = null
    }
    if (io) {
      io.close()
      io = null
    }
  })
})
