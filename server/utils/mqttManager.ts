import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'

interface MqttSubscription {
  topic: string
  callback: (topic: string, message: Buffer) => void
}

class MqttManager {
  private client: MqttClient | null = null
  private subscriptions: MqttSubscription[] = []
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  constructor() {
    this.initialize()
  }

  private initialize() {
    const mqttUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.22.5:1883'
    
    console.log('[MQTT Manager] Connecting to broker:', mqttUrl)
    
    this.client = mqtt.connect(mqttUrl, {
      clientId: `muhportalweb_backend_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000,
    })

    this.client.on('connect', () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.log('[MQTT Manager] Connected to broker')
      
      // Re-subscribe to all topics
      this.subscriptions.forEach((sub) => {
        this.client?.subscribe(sub.topic, (err) => {
          if (err) {
            console.error(`[MQTT Manager] Subscribe error for ${sub.topic}:`, err)
          } else {
            console.log(`[MQTT Manager] Subscribed to ${sub.topic}`)
          }
        })
      })
    })

    this.client.on('close', () => {
      this.isConnected = false
      console.log('[MQTT Manager] Disconnected from broker')
    })

    this.client.on('error', (err) => {
      console.error('[MQTT Manager] Connection error:', err)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[MQTT Manager] Max reconnect attempts reached. Giving up.')
        this.client?.end()
      }
    })

    this.client.on('message', (topic: string, message: Buffer) => {
      // Forward message to all matching subscriptions
      this.subscriptions.forEach((subscription) => {
        const wildcardPattern = subscription.topic
          .replace(/\+/g, '[^/]+')
          .replace(/#/g, '.*')
        
        if (new RegExp(`^${wildcardPattern}$`).test(topic)) {
          subscription.callback(topic, message)
        }
      })
    })
  }

  subscribe(topic: string, callback: (topic: string, message: Buffer) => void) {
    // Check if already subscribed
    const existingSubscription = this.subscriptions.find((sub) => 
      sub.topic === topic && sub.callback === callback
    )
    
    if (!existingSubscription) {
      this.subscriptions.push({ topic, callback })
      
      if (this.client && this.isConnected) {
        this.client.subscribe(topic, (err) => {
          if (err) {
            console.error(`[MQTT Manager] Subscribe error for ${topic}:`, err)
          } else {
            console.log(`[MQTT Manager] Subscribed to ${topic}`)
          }
        })
      }
    }
  }

  unsubscribe(topic: string, callback: (topic: string, message: Buffer) => void) {
    const index = this.subscriptions.findIndex((sub) => 
      sub.topic === topic && sub.callback === callback
    )
    
    if (index !== -1) {
      this.subscriptions.splice(index, 1)
      
      // Check if any other callbacks are still subscribed to this topic
      const stillSubscribed = this.subscriptions.some((sub) => sub.topic === topic)
      
      if (!stillSubscribed && this.client && this.isConnected) {
        this.client.unsubscribe(topic, (err) => {
          if (err) {
            console.error(`[MQTT Manager] Unsubscribe error for ${topic}:`, err)
          } else {
            console.log(`[MQTT Manager] Unsubscribed from ${topic}`)
          }
        })
      }
    }
  }

  publish(topic: string, message: string) {
    if (this.client && this.isConnected) {
      this.client.publish(topic, message, (err) => {
        if (err) {
          console.error(`[MQTT Manager] Publish error for ${topic}:`, err)
        } else {
          console.log(`[MQTT Manager] Published to ${topic}:`, message)
        }
      })
    } else {
      console.warn('[MQTT Manager] Cannot publish - not connected to broker')
    }
  }

  getConnectionStatus() {
    return this.isConnected
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      this.client = null
      this.isConnected = false
      this.subscriptions = []
      console.log('[MQTT Manager] Disconnected and cleaned up')
    }
  }
}

// Singleton instance
let mqttManager: MqttManager | null = null

export function getMqttManager(): MqttManager {
  if (!mqttManager) {
    mqttManager = new MqttManager()
  }
  return mqttManager
}
