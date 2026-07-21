import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'
import { topicMatchesPattern } from '#shared/utils/mqtt'
import { debugLog } from '../utils/logger'

interface SocketSubscription {
  topic: string
  messageHandler: (topic: string, message: BufferLike) => void
}

// Browser-compatible Buffer-like object
interface BufferLike {
  toString(): string
}

function createBufferLike(str: string): BufferLike {
  return {
    toString() {
      return str
    },
  }
}

const AUTH_TOKEN_KEY = 'muhportal:auth-token'

export function getAuthToken(): string {
  if (!import.meta.client) return ''
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
}

export function setAuthToken(token: string) {
  if (!import.meta.client) return
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

// Module-scoped singleton: one Socket.IO connection shared by all pages.
// Navigating between pages only swaps handler registrations - the socket
// (and the server-side MQTT subscriptions) survive.
let socket: Socket | null = null
const isConnected = ref(false)
const brokerConnected = ref(true)
const authFailed = ref(false)
const activeSubscriptions: SocketSubscription[] = []

// red: no socket, orange: socket up but MQTT broker down, green: all good
const statusColor = computed(() => {
  if (!isConnected.value) return 'red'
  if (!brokerConnected.value) return 'orange'
  return 'green'
})

function createSocket(): Socket {
  const token = getAuthToken()
  return io(token ? { auth: { token } } : {})
}

function initializeSocketEventHandlers(socketInstance: Socket) {
  socketInstance.on('connect', () => {
    isConnected.value = true
    debugLog.log('Socket.IO: Connected to server')

    // Re-subscribe to all topics after (re)connect
    activeSubscriptions.forEach((subscription) => {
      socketInstance.emit('mqtt-subscribe', { topic: subscription.topic })
    })
  })

  socketInstance.on('disconnect', () => {
    isConnected.value = false
    debugLog.log('Socket.IO: Disconnected from server')
  })

  socketInstance.on('mqtt-status', (data: { connected: boolean }) => {
    brokerConnected.value = data.connected
  })

  socketInstance.on('mqtt-message', (data: { topic: string; message: string }) => {
    debugLog.log('Socket.IO: Received MQTT message:', data.topic, data.message)
    const messageBuffer = createBufferLike(data.message)

    activeSubscriptions.forEach((subscription) => {
      if (topicMatchesPattern(subscription.topic, data.topic)) {
        subscription.messageHandler(data.topic, messageBuffer)
      }
    })
  })

  socketInstance.on('mqtt-error', (data: { error: string }) => {
    debugLog.error('Socket.IO: MQTT error:', data.error)
  })

  socketInstance.on('connect_error', (err) => {
    debugLog.error('Socket.IO: Connection error:', err)
    if (err.message === 'unauthorized') {
      authFailed.value = true
      // Wrong/missing token - stop hammering the server until reconfigured
      socketInstance.disconnect()
    }
  })
}

function removeSubscriptions(subs: SocketSubscription[]) {
  subs.forEach((sub) => {
    const index = activeSubscriptions.indexOf(sub)
    if (index !== -1) activeSubscriptions.splice(index, 1)
  })
}

export function useSocketIO() {
  // Subscriptions registered by this component instance, cleaned up on unmount
  const instanceSubscriptions: SocketSubscription[] = []

  const connectToBroker = () => {
    if (import.meta.client && !socket) {
      // Connect to Socket.IO server (same host as Nuxt app)
      socket = createSocket()
      initializeSocketEventHandlers(socket)
    }
    return socket
  }

  const reconnectToBroker = () => {
    if (import.meta.client) {
      if (socket) {
        socket.disconnect()
        socket = null
      }
      authFailed.value = false
      socket = createSocket()
      initializeSocketEventHandlers(socket)
    }
  }

  const subscribeToTopic = (topic: string, messageHandler: (topic: string, message: BufferLike) => void) => {
    const subscription: SocketSubscription = { topic, messageHandler }
    instanceSubscriptions.push(subscription)
    activeSubscriptions.push(subscription)
    debugLog.log('Socket.IO: Added subscription for topic:', topic)

    if (socket?.connected) {
      socket.emit('mqtt-subscribe', { topic })
    } else {
      debugLog.log('Socket.IO: Socket not connected yet, subscription will be sent on connect for:', topic)
    }
  }

  const publishMessage = (topic: string, payload: string, options?: { qos?: 0 | 1 | 2; retain?: boolean }) => {
    if (socket?.connected) {
      socket.emit('mqtt-publish', { topic, payload, ...options })
    }
  }

  const configureMqtt = (server: string, username?: string, password?: string) => {
    if (socket?.connected) {
      socket.emit('mqtt-configure', { server, username, password })
    }
  }

  const disconnectFromBroker = () => {
    if (socket) {
      socket.disconnect()
      socket = null
      isConnected.value = false
      activeSubscriptions.length = 0
    }
  }

  onUnmounted(() => {
    // Only drop this component's handlers - the shared socket stays up
    removeSubscriptions(instanceSubscriptions)
    instanceSubscriptions.length = 0
  })

  return {
    isConnected,
    brokerConnected,
    authFailed,
    statusColor,
    connectToBroker,
    reconnectToBroker,
    subscribeToTopic,
    publishMessage,
    configureMqtt,
    disconnectFromBroker,
  }
}
