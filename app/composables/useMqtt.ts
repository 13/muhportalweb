// Store subscriptions for reconnection
interface MqttSubscription {
  topic: string
  messageHandler: (topic: string, message: Buffer) => void
}

export function useMqtt() {
  const config = useRuntimeConfig()
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const activeSubscriptions = ref<MqttSubscription[]>([])
  const reconnectTimer = ref<NodeJS.Timeout | null>(null)
  const reconnectDelay = 3000 // 3 seconds

  const getWebSocketUrl = () => {
    // Use configured WS_URL if available
    if (config.public.wsUrl) {
      return config.public.wsUrl
    }
    
    // Otherwise, construct WebSocket URL based on current location
    if (import.meta.client) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      return `${protocol}//${host}/ws`
    }
    
    return 'ws://localhost:3000/ws'
  }

  const connectToWebSocket = () => {
    if (import.meta.client && !ws.value) {
      const wsUrl = getWebSocketUrl()
      console.log('WebSocket: Connecting to', wsUrl)
      
      try {
        ws.value = new WebSocket(wsUrl)

        ws.value.onopen = () => {
          console.log('WebSocket: Connected')
          isConnected.value = true
          
          // Clear any pending reconnection
          if (reconnectTimer.value) {
            clearTimeout(reconnectTimer.value)
            reconnectTimer.value = null
          }

          // Re-subscribe to all topics after reconnect
          activeSubscriptions.value.forEach((subscription) => {
            if (ws.value && ws.value.readyState === WebSocket.OPEN) {
              ws.value.send(JSON.stringify({
                type: 'subscribe',
                topic: subscription.topic,
              }))
            }
          })
        }

        ws.value.onclose = () => {
          console.log('WebSocket: Disconnected')
          isConnected.value = false
          ws.value = null

          // Attempt to reconnect after delay
          if (!reconnectTimer.value) {
            reconnectTimer.value = setTimeout(() => {
              reconnectTimer.value = null
              connectToWebSocket()
            }, reconnectDelay)
          }
        }

        ws.value.onerror = (error) => {
          console.error('WebSocket: Error', error)
        }

        ws.value.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'message') {
              const topic = data.topic
              const message = Buffer.from(data.message)
              
              // Dispatch to all matching subscriptions
              activeSubscriptions.value.forEach((subscription) => {
                const wildcardPattern = subscription.topic.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
                if (new RegExp(`^${wildcardPattern}$`).test(topic)) {
                  subscription.messageHandler(topic, message)
                }
              })
            }
          } catch (err) {
            console.error('WebSocket: Error processing message', err)
          }
        }
      } catch (err) {
        console.error('WebSocket: Connection error', err)
      }
    }
  }

  const connectToBroker = () => {
    connectToWebSocket()
    return ws.value
  }

  const reconnectToBroker = () => {
    if (import.meta.client) {
      // Disconnect existing WebSocket
      if (ws.value) {
        ws.value.close()
        ws.value = null
      }
      
      // Clear reconnect timer
      if (reconnectTimer.value) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
      }
      
      // Create new connection
      connectToWebSocket()
    }
  }

  const subscribeToTopic = (topic: string, messageHandler: (topic: string, message: Buffer) => void) => {
    // Store subscription for reconnection
    const existingSubscription = activeSubscriptions.value.find((sub) => sub.topic === topic)
    if (!existingSubscription) {
      activeSubscriptions.value.push({ topic, messageHandler })
    }

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
    }
  }

  const disconnectFromBroker = () => {
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
    mqttClient: ws,
    isConnected,
    connectToBroker,
    reconnectToBroker,
    subscribeToTopic,
    publishMessage,
    disconnectFromBroker,
  }
}
