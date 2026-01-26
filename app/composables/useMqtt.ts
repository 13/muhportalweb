// Store subscriptions for reconnection
interface MqttSubscription {
  topic: string
  messageHandler: (topic: string, message: Buffer | string) => void
}

export function useMqtt() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const activeSubscriptions = ref<MqttSubscription[]>([])
  const reconnectTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelay = 5000 // 5 seconds

  const getWebSocketUrl = () => {
    if (import.meta.server) return ''
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/api/mqtt-ws`
  }

  const initializeWebSocketEventHandlers = (socket: WebSocket) => {
    socket.onopen = () => {
      isConnected.value = true
      console.log('WebSocket: Connected to backend')
      
      // Clear any pending reconnect timer
      if (reconnectTimer.value) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
      }

      // Re-subscribe to all topics after reconnect
      activeSubscriptions.value.forEach((subscription) => {
        socket.send(JSON.stringify({
          type: 'subscribe',
          topic: subscription.topic,
        }))
      })
    }

    socket.onclose = () => {
      isConnected.value = false
      console.log('WebSocket: Disconnected from backend')
      
      // Attempt to reconnect after delay
      if (!reconnectTimer.value) {
        reconnectTimer.value = setTimeout(() => {
          console.log('WebSocket: Attempting to reconnect...')
          reconnectToBroker()
        }, reconnectDelay)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket: Connection error:', error)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'connection':
            console.log('WebSocket: Connection status:', data.status)
            break

          case 'message':
            // Forward message to all matching subscriptions
            activeSubscriptions.value.forEach((subscription) => {
              const wildcardPattern = subscription.topic
                .replace(/\+/g, '[^/]+')
                .replace(/#/g, '.*')
              
              if (new RegExp(`^${wildcardPattern}$`).test(data.topic)) {
                // Pass payload as string (compatible with Buffer.toString())
                subscription.messageHandler(data.topic, data.payload)
              }
            })
            break

          case 'pong':
            // Keep-alive response
            break

          default:
            console.warn('WebSocket: Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('WebSocket: Error processing message:', error)
      }
    }
  }

  const connectToBroker = () => {
    if (import.meta.client && !ws.value) {
      const wsUrl = getWebSocketUrl()
      console.log('WebSocket: Connecting to', wsUrl)
      ws.value = new WebSocket(wsUrl)
      initializeWebSocketEventHandlers(ws.value)
    }
    return ws.value
  }

  const reconnectToBroker = () => {
    if (import.meta.client) {
      // Clear any pending reconnect timer
      if (reconnectTimer.value) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
      }

      // Disconnect existing connection
      if (ws.value) {
        ws.value.close()
        ws.value = null
      }

      // Create new connection
      const wsUrl = getWebSocketUrl()
      console.log('WebSocket: Reconnecting to', wsUrl)
      ws.value = new WebSocket(wsUrl)
      initializeWebSocketEventHandlers(ws.value)
    }
  }

  const subscribeToTopic = (topic: string, messageHandler: (topic: string, message: Buffer | string) => void) => {
    // Store subscription for reconnection
    const existingSubscription = activeSubscriptions.value.find((sub) => sub.topic === topic)
    if (!existingSubscription) {
      activeSubscriptions.value.push({ topic, messageHandler })
    }

    // Send subscribe message to backend
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'subscribe',
        topic,
      }))
    }
  }

  const publishMessage = (topic: string, payload: string) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'publish',
        topic,
        payload,
      }))
    } else {
      console.warn('WebSocket: Cannot publish - not connected')
    }
  }

  const disconnectFromBroker = () => {
    // Clear reconnect timer
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }

    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
      activeSubscriptions.value = []
    }
  }

  onUnmounted(() => {
    disconnectFromBroker()
  })

  return {
    isConnected,
    connectToBroker,
    reconnectToBroker,
    subscribeToTopic,
    publishMessage,
    disconnectFromBroker,
  }
}
