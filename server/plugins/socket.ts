import { Server as SocketIOServer } from 'socket.io'
import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import type { Server } from 'node:http'
import { debugLog } from '../utils/logger'

interface MqttSubscription {
  topic: string
  clients: Set<string>
}

const subscriptions = new Map<string, MqttSubscription>()
const messageCache = new Map<string, string>()
let mqttClient: MqttClient | null = null
let io: SocketIOServer | null = null
let isInitializing = false

function topicMatchesPattern(pattern: string, topic: string): boolean {
  const wildcardPattern = pattern.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
  return new RegExp(`^${wildcardPattern}$`).test(topic)
}

function setupMqttClient(url: string, username?: string, password?: string) {
  if (mqttClient) {
    mqttClient.end(true)
    mqttClient = null
  }

  debugLog.log('MQTT: Connecting to broker:', url)
  const options: mqtt.IClientOptions = {}
  if (username) options.username = username
  if (password) options.password = password

  mqttClient = mqtt.connect(url, options)

  mqttClient.on('connect', () => {
    debugLog.log('MQTT: Connected to broker')
    // Re-subscribe to all active topics
    subscriptions.forEach((_, topic) => {
      mqttClient?.subscribe(topic)
    })
  })

  mqttClient.on('close', () => {
    debugLog.log('MQTT: Disconnected from broker')
  })

  mqttClient.on('error', (err) => {
    debugLog.error('MQTT: Connection error:', err)
  })

  mqttClient.on('message', (topic: string, message: Buffer) => {
    debugLog.log('MQTT: Received message on topic:', topic, 'Content:', message.toString())

    messageCache.set(topic, message.toString())

    const subscription = subscriptions.get(topic)
    if (subscription && io) {
      subscription.clients.forEach((socketId) => {
        const socket = io!.sockets.sockets.get(socketId)
        if (socket) {
          socket.emit('mqtt-message', { topic, message: message.toString() })
        }
      })
    }

    subscriptions.forEach((sub, subTopic) => {
      if (subTopic !== topic && topicMatchesPattern(subTopic, topic)) {
        sub.clients.forEach((socketId) => {
          const socket = io?.sockets.sockets.get(socketId)
          if (socket) {
            socket.emit('mqtt-message', { topic, message: message.toString() })
          }
        })
      }
    })
  })
}

function setupSocketIO(server: Server) {
  if (io || isInitializing) return
  isInitializing = true

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  debugLog.log('Socket.IO: allowedOrigins: ', allowedOrigins)

  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (process.env.NODE_ENV !== 'production' && (origin?.includes('localhost') || origin?.includes('127.0.0.1'))) {
          return callback(null, true)
        }
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
    debugLog.log('Socket.IO: Client connected:', socket.id)

    socket.on('mqtt-subscribe', (data: { topic: string }) => {
      const { topic } = data
      debugLog.log('Socket.IO: Client', socket.id, 'subscribing to:', topic)

      if (!subscriptions.has(topic)) {
        subscriptions.set(topic, { topic, clients: new Set() })
        debugLog.log('Socket.IO: First subscription to', topic, '- subscribing to MQTT broker')
        mqttClient?.subscribe(topic, (err) => {
          if (err) {
            debugLog.error('MQTT: Subscribe error for topic', topic, ':', err)
            socket.emit('mqtt-error', { error: 'Failed to subscribe to topic' })
          } else {
            debugLog.log('MQTT: Successfully subscribed to topic:', topic)
          }
        })
      } else {
        debugLog.log('Socket.IO: Adding client to existing subscription for:', topic)
      }
      subscriptions.get(topic)?.clients.add(socket.id)

      messageCache.forEach((cachedMessage, cachedTopic) => {
        if (cachedTopic === topic || topicMatchesPattern(topic, cachedTopic)) {
          debugLog.log('Socket.IO: Sending cached message to new subscriber for topic:', cachedTopic)
          socket.emit('mqtt-message', { topic: cachedTopic, message: cachedMessage })
        }
      })
    })

    socket.on('mqtt-publish', (data: { topic: string; payload: string }) => {
      const { topic, payload } = data
      debugLog.log('Socket.IO: Client publishing to:', topic, payload)
      if (mqttClient) {
        mqttClient.publish(topic, payload)
      } else {
        socket.emit('mqtt-error', { error: 'MQTT client not connected' })
      }
    })

    socket.on('mqtt-configure', (data: { server: string; username?: string; password?: string }) => {
      debugLog.log('Socket.IO: Client requesting MQTT reconfiguration to:', data.server)
      setupMqttClient(data.server, data.username, data.password)
      socket.emit('mqtt-configured', { server: data.server })
    })

    socket.on('disconnect', () => {
      debugLog.log('Socket.IO: Client disconnected:', socket.id)
      subscriptions.forEach((sub, topic) => {
        sub.clients.delete(socket.id)
        if (sub.clients.size === 0) {
          mqttClient?.unsubscribe(topic)
          subscriptions.delete(topic)
        }
      })
    })
  })

  debugLog.log('Socket.IO server initialized')
  isInitializing = false
}

export default defineNitroPlugin((nitroApp) => {
  const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.22.5:1883'
  debugLog.log('Setting up Socket.IO and MQTT bridge...')

  setupMqttClient(mqttBrokerUrl)

  nitroApp.hooks.hookOnce('request', (event) => {
    if (!io && event.node.res.socket?.server) {
      setupSocketIO(event.node.res.socket.server)
    }
  })

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
