import { io, Socket } from 'socket.io-client'

// Store subscriptions for reconnection
interface MqttSubscription {
  topic: string
  messageHandler: (topic: string, message: Buffer) => void
}

export function useMqtt() {
  const config = useRuntimeConfig()
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const activeSubscriptions = ref<MqttSubscription[]>([])

  const getSocketUrl = () => {
    // Use configured WS_URL if available
    if (config.public.wsUrl) {
      return config.public.wsUrl
    }
    
    // Otherwise, construct Socket.IO URL based on current location
    if (import.meta.client) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
      const host = window.location.host
      return `${protocol}//${host}`
    }
    
    return 'http://localhost:3000'
  }

  const connectToSocket = () => {
    if (import.meta.client && !socket.value) {
      const socketUrl = getSocketUrl()
      console.log('Socket.IO: Connecting to', socketUrl)
      
      try {
        socket.value = io(socketUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          autoConnect: true,
        })

        socket.value.on('connect', () => {
          console.log('Socket.IO: Connected')
          isConnected.value = true

          // Re-subscribe to all topics after reconnect
          activeSubscriptions.value.forEach((subscription) => {
            if (socket.value?.connected) {
              socket.value.emit('subscribe', { topic: subscription.topic })
            }
          })
        })

        socket.value.on('disconnect', () => {
          console.log('Socket.IO: Disconnected')
          isConnected.value = false
        })

        socket.value.on('connect_error', (error) => {
          console.error('Socket.IO: Connection error', error)
        })

        socket.value.on('connected', (data: { mqttConnected: boolean }) => {
          console.log('Socket.IO: Server connection status', data)
        })

        socket.value.on('message', (data: { topic: string, message: string }) => {
          try {
            const message = Buffer.from(data.message)
            
            // Dispatch to all matching subscriptions
            activeSubscriptions.value.forEach((subscription) => {
              const wildcardPattern = subscription.topic.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
              if (new RegExp(`^${wildcardPattern}$`).test(data.topic)) {
                subscription.messageHandler(data.topic, message)
              }
            })
          } catch (err) {
            console.error('Socket.IO: Error processing message', err)
          }
        })
      } catch (err) {
        console.error('Socket.IO: Connection error', err)
      }
    }
  }

  const connectToBroker = () => {
    connectToSocket()
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
      connectToSocket()
    }
  }

  const subscribeToTopic = (topic: string, messageHandler: (topic: string, message: Buffer) => void) => {
    // Store subscription for reconnection
    const existingSubscription = activeSubscriptions.value.find((sub) => sub.topic === topic)
    if (!existingSubscription) {
      activeSubscriptions.value.push({ topic, messageHandler })
    }

    if (socket.value?.connected) {
      socket.value.emit('subscribe', { topic })
    }
  }

  const publishMessage = (topic: string, payload: string) => {
    if (socket.value?.connected) {
      socket.value.emit('publish', { topic, payload })
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
    mqttClient: socket,
    isConnected,
    connectToBroker,
    reconnectToBroker,
    subscribeToTopic,
    publishMessage,
    disconnectFromBroker,
  }
}
