import { Server as SocketIOServer } from 'socket.io'
import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import type { Server } from 'node:http'
import { topicMatchesPattern } from '#shared/utils/mqtt'
import { debugLog } from './logger'

interface MqttSubscription {
  topic: string
  clients: Set<string>
}

export interface MqttBridgeOptions {
  brokerUrl: string
  corsOrigins?: string[]
  allowReconfigure?: boolean
  /** When set, Socket.IO handshakes must present this token via auth.token */
  authToken?: string
  /** Allow localhost origins regardless of the CORS list (dev convenience) */
  allowLocalhostOrigins?: boolean
}

// Cap the retained-message cache so wildcard-heavy brokers can't grow it unbounded
const MESSAGE_CACHE_MAX = 500

export function createMqttBridge(options: MqttBridgeOptions) {
  const subscriptions = new Map<string, MqttSubscription>()
  const messageCache = new Map<string, string>()
  let mqttClient: MqttClient | null = null
  let io: SocketIOServer | null = null
  let brokerConnected = false

  const allowedOrigins = (options.corsOrigins ?? []).map((s) => s.trim()).filter(Boolean)
  if (allowedOrigins.length === 0) allowedOrigins.push('http://localhost:3000')
  const allowAllOrigins = allowedOrigins.includes('*')

  function cacheMessage(topic: string, message: string) {
    if (!messageCache.has(topic) && messageCache.size >= MESSAGE_CACHE_MAX) {
      const oldest = messageCache.keys().next().value
      if (oldest !== undefined) messageCache.delete(oldest)
    }
    messageCache.set(topic, message)
  }

  function broadcastBrokerStatus(connected: boolean) {
    brokerConnected = connected
    io?.emit('mqtt-status', { connected })
  }

  function connectMqtt(url?: string, username?: string, password?: string) {
    if (mqttClient) {
      mqttClient.end(true)
      mqttClient = null
    }

    const brokerUrl = url ?? options.brokerUrl
    debugLog.log('MQTT: Connecting to broker:', brokerUrl)
    const clientOptions: mqtt.IClientOptions = {
      reconnectPeriod: 5000,
      connectTimeout: 30_000,
    }
    if (username) clientOptions.username = username
    if (password) clientOptions.password = password

    mqttClient = mqtt.connect(brokerUrl, clientOptions)

    mqttClient.on('connect', () => {
      debugLog.log('MQTT: Connected to broker')
      broadcastBrokerStatus(true)
      // Re-subscribe to all active topics
      subscriptions.forEach((_, topic) => {
        mqttClient?.subscribe(topic)
      })
    })

    mqttClient.on('close', () => {
      debugLog.log('MQTT: Disconnected from broker')
      broadcastBrokerStatus(false)
    })

    mqttClient.on('error', (err) => {
      debugLog.error('MQTT: Connection error:', err)
    })

    mqttClient.on('message', (topic: string, message: Buffer) => {
      const payload = message.toString()
      debugLog.log('MQTT: Received message on topic:', topic, 'Content:', payload)

      cacheMessage(topic, payload)

      if (!io) return
      // Collect target sockets across all matching subscriptions, emit once per socket
      const targets = new Set<string>()
      subscriptions.forEach((sub, subTopic) => {
        if (subTopic === topic || topicMatchesPattern(subTopic, topic)) {
          sub.clients.forEach((socketId) => targets.add(socketId))
        }
      })
      targets.forEach((socketId) => {
        io?.sockets.sockets.get(socketId)?.emit('mqtt-message', { topic, message: payload })
      })
    })
  }

  function attach(server: Server) {
    if (io) return io

    debugLog.log('Socket.IO: allowedOrigins: ', allowedOrigins)

    io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // No Origin header: same-origin or non-browser client
          if (!origin) return callback(null, true)
          if (allowAllOrigins) return callback(null, true)
          if (options.allowLocalhostOrigins && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true)
          }
          if (allowedOrigins.includes(origin)) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS'))
          }
        },
        methods: ['GET', 'POST'],
        // Wildcard origin with credentials is an unsafe combination - only send
        // credentials when origins are explicitly listed
        credentials: !allowAllOrigins,
      },
      path: '/socket.io/',
    })

    if (options.authToken) {
      io.use((socket, next) => {
        const token = socket.handshake.auth?.token
        if (token === options.authToken) return next()
        debugLog.warn('Socket.IO: Rejected unauthenticated connection from', socket.handshake.address)
        next(new Error('unauthorized'))
      })
    }

    io.on('connection', (socket) => {
      debugLog.log('Socket.IO: Client connected:', socket.id)
      socket.emit('mqtt-status', { connected: brokerConnected })

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
        }
        subscriptions.get(topic)?.clients.add(socket.id)

        messageCache.forEach((cachedMessage, cachedTopic) => {
          if (cachedTopic === topic || topicMatchesPattern(topic, cachedTopic)) {
            socket.emit('mqtt-message', { topic: cachedTopic, message: cachedMessage })
          }
        })
      })

      socket.on('mqtt-publish', (data: { topic: string; payload: string; qos?: 0 | 1 | 2; retain?: boolean }) => {
        const { topic, payload, qos, retain } = data
        debugLog.log('Socket.IO: Client publishing to:', topic, payload)
        if (mqttClient) {
          mqttClient.publish(topic, payload, { qos: qos ?? 0, retain: retain ?? false })
        } else {
          socket.emit('mqtt-error', { error: 'MQTT client not connected' })
        }
      })

      socket.on('mqtt-configure', (data: { server: string; username?: string; password?: string }) => {
        // Reconfiguring the broker affects every connected client and lets a
        // browser point this server at an arbitrary host - opt-in only
        if (!options.allowReconfigure) {
          debugLog.warn('Socket.IO: Rejected mqtt-configure from', socket.id, '(ALLOW_MQTT_RECONFIGURE not enabled)')
          socket.emit('mqtt-error', { error: 'MQTT reconfiguration is disabled on this server' })
          return
        }
        debugLog.log('Socket.IO: Client requesting MQTT reconfiguration to:', data.server)
        connectMqtt(data.server, data.username, data.password)
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
    return io
  }

  function close() {
    if (mqttClient) {
      mqttClient.end(true)
      mqttClient = null
    }
    if (io) {
      io.close()
      io = null
    }
  }

  return {
    connectMqtt,
    attach,
    close,
    get isAttached() {
      return io !== null
    },
  }
}
