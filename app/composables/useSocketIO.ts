import { io, Socket } from 'socket.io-client'

// Store subscriptions for reconnection
interface SocketSubscription {
  topic: string
  messageHandler: (topic: string, message: BufferLike) => void
}

// Browser-compatible Buffer-like object
interface BufferLike {
  toString(): string
}

// Helper function to create a Buffer-like object from a string
function createBufferLike(str: string): BufferLike {
  return {
    toString() {
      return str
    }
  }
}

// Helper function to check if topic matches wildcard pattern
function topicMatchesPattern(pattern: string, topic: string): boolean {
  const wildcardPattern = pattern.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
  return new RegExp(`^${wildcardPattern}$`).test(topic)
}

export function useSocketIO() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const activeSubscriptions = ref<SocketSubscription[]>([])

  const initializeSocketEventHandlers = (socketInstance: Socket) => {
    socketInstance.on('connect', () => {
      isConnected.value = true
      console.log('Socket.IO: Connected to server')
      
      // Re-subscribe to all topics after reconnect
      activeSubscriptions.value.forEach((subscription) => {
        socketInstance.emit('mqtt-subscribe', { topic: subscription.topic })
      })
    })

    socketInstance.on('disconnect', () => {
      isConnected.value = false
      console.log('Socket.IO: Disconnected from server')
    })

    socketInstance.on('mqtt-message', (data: { topic: string; message: string }) => {
      console.log('Socket.IO: Received MQTT message:', data.topic, data.message)
      // Convert message string to Buffer-like object for compatibility with existing code
      const messageBuffer = createBufferLike(data.message)
      
      activeSubscriptions.value.forEach((subscription) => {
        // Check if the topic matches (supports wildcards)
        if (topicMatchesPattern(subscription.topic, data.topic)) {
          console.log('Socket.IO: Forwarding message to handler for topic:', subscription.topic)
          subscription.messageHandler(data.topic, messageBuffer)
        }
      })
    })

    socketInstance.on('mqtt-error', (data: { error: string }) => {
      console.error('Socket.IO: MQTT error:', data.error)
    })

    socketInstance.on('connect_error', (err) => {
      console.error('Socket.IO: Connection error:', err)
    })
  }

  const connectToBroker = () => {
    if (import.meta.client && !socket.value) {
      // Connect to Socket.IO server (same host as Nuxt app)
      socket.value = io()
      initializeSocketEventHandlers(socket.value)
    }
    return socket.value
  }

  const reconnectToBroker = () => {
    if (import.meta.client) {
      // Disconnect existing socket
      if (socket.value) {
        socket.value.disconnect()
        socket.value = null
      }
      // Create new connection
      socket.value = io()
      initializeSocketEventHandlers(socket.value)
    }
  }

  const subscribeToTopic = (topic: string, messageHandler: (topic: string, message: BufferLike) => void) => {
    // Store subscription for reconnection
    const existingSubscription = activeSubscriptions.value.find((sub) => sub.topic === topic)
    if (!existingSubscription) {
      activeSubscriptions.value.push({ topic, messageHandler })
      console.log('Socket.IO: Added subscription for topic:', topic)
    }

    if (socket.value?.connected) {
      console.log('Socket.IO: Socket connected, sending subscription for:', topic)
      socket.value.emit('mqtt-subscribe', { topic })
    } else {
      console.log('Socket.IO: Socket not connected yet, subscription will be sent on connect for:', topic)
    }
  }

  const publishMessage = (topic: string, payload: string) => {
    if (socket.value?.connected) {
      socket.value.emit('mqtt-publish', { topic, payload })
    }
  }

  const disconnectFromBroker = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      activeSubscriptions.value = []
    }
  }

  onUnmounted(() => {
    disconnectFromBroker()
  })

  return {
    socket,
    isConnected,
    connectToBroker,
    reconnectToBroker,
    subscribeToTopic,
    publishMessage,
    disconnectFromBroker,
  }
}
