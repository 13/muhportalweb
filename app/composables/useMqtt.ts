import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'

// Store subscriptions for reconnection
interface MqttSubscription {
  topic: string
  messageHandler: (topic: string, message: Buffer) => void
}

export function useMqtt() {
  const config = useRuntimeConfig()
  const mqttClient = ref<MqttClient | null>(null)
  const isConnected = ref(false)
  const activeSubscriptions = ref<MqttSubscription[]>([])

  const initializeMqttEventHandlers = (client: MqttClient) => {
    client.on('connect', () => {
      isConnected.value = true
      console.log('MQTT: Connected to broker')
      // Re-subscribe to all topics after reconnect
      activeSubscriptions.value.forEach((subscription) => {
        client.subscribe(subscription.topic, (err) => {
          if (err) console.error('MQTT: Subscribe error:', err)
        })
      })
    })

    client.on('close', () => {
      isConnected.value = false
      console.log('MQTT: Disconnected from broker')
    })

    client.on('error', (err) => {
      console.error('MQTT: Connection error:', err)
    })

    client.on('message', (topic: string, message: Buffer) => {
      activeSubscriptions.value.forEach((subscription) => {
        // Check if the topic matches (supports wildcards)
        const wildcardPattern = subscription.topic.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
        if (new RegExp(`^${wildcardPattern}$`).test(topic)) {
          subscription.messageHandler(topic, message)
        }
      })
    })
  }

  const connectToBroker = () => {
    if (import.meta.client && !mqttClient.value) {
      // Use path: '' to prevent MQTT.js from appending /mqtt (Mosquitto doesn't use paths)
      mqttClient.value = mqtt.connect(config.public.mqttWsUrl as string, { path: '' })
      initializeMqttEventHandlers(mqttClient.value)
    }
    return mqttClient.value
  }

  const reconnectToBroker = () => {
    if (import.meta.client) {
      // Disconnect existing client
      if (mqttClient.value) {
        mqttClient.value.end(true)
        mqttClient.value = null
      }
      // Create new connection (use path: '' to prevent MQTT.js from appending /mqtt)
      mqttClient.value = mqtt.connect(config.public.mqttWsUrl as string, { path: '' })
      initializeMqttEventHandlers(mqttClient.value)
    }
  }

  const subscribeToTopic = (topic: string, messageHandler: (topic: string, message: Buffer) => void) => {
    // Store subscription for reconnection
    const existingSubscription = activeSubscriptions.value.find((sub) => sub.topic === topic)
    if (!existingSubscription) {
      activeSubscriptions.value.push({ topic, messageHandler })
    }

    if (mqttClient.value) {
      mqttClient.value.subscribe(topic, (err) => {
        if (err) {
          console.error('MQTT: Subscribe error:', err)
        }
      })
    }
  }

  const publishMessage = (topic: string, payload: string) => {
    if (mqttClient.value) {
      mqttClient.value.publish(topic, payload)
    }
  }

  const disconnectFromBroker = () => {
    if (mqttClient.value) {
      mqttClient.value.end()
      mqttClient.value = null
      isConnected.value = false
      activeSubscriptions.value = []
    }
  }

  onUnmounted(() => {
    disconnectFromBroker()
  })

  return {
    mqttClient,
    isConnected,
    connectToBroker,
    reconnectToBroker,
    subscribeToTopic,
    publishMessage,
    disconnectFromBroker,
  }
}
