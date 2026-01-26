import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import type { Socket } from 'socket.io'

interface MqttSubscription {
  topic: string
  clients: Set<Socket>
}

class MqttManager {
  private client: MqttClient | null = null
  private subscriptions: Map<string, MqttSubscription> = new Map()
  private connectedClients: Set<Socket> = new Set()
  private mqttUrl: string = ''

  initialize(mqttUrl: string) {
    this.mqttUrl = mqttUrl
    this.connectToMqtt()
  }

  private connectToMqtt() {
    if (this.client) {
      return
    }

    console.log('[MQTT Manager] Connecting to MQTT broker:', this.mqttUrl)
    this.client = mqtt.connect(this.mqttUrl)

    this.client.on('connect', () => {
      console.log('[MQTT Manager] Connected to MQTT broker')
      // Re-subscribe to all topics
      this.subscriptions.forEach((sub, topic) => {
        this.client?.subscribe(topic, (err) => {
          if (err) {
            console.error('[MQTT Manager] Subscribe error:', err)
          } else {
            console.log('[MQTT Manager] Subscribed to:', topic)
          }
        })
      })
    })

    this.client.on('message', (topic: string, message: Buffer) => {
      console.log('[MQTT Manager] Received message on', topic)
      this.broadcastToSubscribers(topic, message)
    })

    this.client.on('error', (err) => {
      console.error('[MQTT Manager] MQTT error:', err)
    })

    this.client.on('close', () => {
      console.log('[MQTT Manager] MQTT connection closed')
    })
  }

  addClient(socket: Socket) {
    this.connectedClients.add(socket)
    console.log('[MQTT Manager] Client connected. Total clients:', this.connectedClients.size)
  }

  removeClient(socket: Socket) {
    this.connectedClients.delete(socket)
    // Remove client from all subscriptions
    this.subscriptions.forEach((sub, topic) => {
      sub.clients.delete(socket)
      // Clean up empty subscriptions
      if (sub.clients.size === 0) {
        this.subscriptions.delete(topic)
        if (this.client) {
          this.client.unsubscribe(topic, (err) => {
            if (err) {
              console.error('[MQTT Manager] Unsubscribe error:', err)
            } else {
              console.log('[MQTT Manager] Unsubscribed from:', topic)
            }
          })
        }
      }
    })
    console.log('[MQTT Manager] Client disconnected. Total clients:', this.connectedClients.size)
  }

  subscribe(topic: string, socket: Socket) {
    let subscription = this.subscriptions.get(topic)

    if (!subscription) {
      subscription = {
        topic,
        clients: new Set(),
      }
      this.subscriptions.set(topic, subscription)

      // Subscribe to MQTT topic if this is the first subscriber
      if (this.client) {
        this.client.subscribe(topic, (err) => {
          if (err) {
            console.error('[MQTT Manager] Subscribe error:', err)
          } else {
            console.log('[MQTT Manager] Subscribed to:', topic)
          }
        })
      }
    }

    subscription.clients.add(socket)
    console.log('[MQTT Manager] Client subscribed to:', topic)
  }

  publish(topic: string, payload: string) {
    if (this.client) {
      this.client.publish(topic, payload)
      console.log('[MQTT Manager] Published to', topic, ':', payload)
    } else {
      console.error('[MQTT Manager] Cannot publish - not connected to MQTT broker')
    }
  }

  private broadcastToSubscribers(topic: string, message: Buffer) {
    // Find all subscriptions that match this topic (with wildcard support)
    this.subscriptions.forEach((subscription, subscribedTopic) => {
      if (this.topicMatches(topic, subscribedTopic)) {
        const messageData = {
          topic,
          message: message.toString(),
        }

        subscription.clients.forEach((socket) => {
          if (socket.connected) {
            try {
              socket.emit('message', messageData)
            } catch (err) {
              console.error('[MQTT Manager] Error sending to client:', err)
            }
          }
        })
      }
    })
  }

  private topicMatches(actualTopic: string, subscribedTopic: string): boolean {
    // Convert MQTT wildcards to regex pattern
    const wildcardPattern = subscribedTopic
      .replace(/\+/g, '[^/]+')
      .replace(/#/g, '.*')
    const regex = new RegExp(`^${wildcardPattern}$`)
    return regex.test(actualTopic)
  }

  getConnectionStatus(): boolean {
    return this.client?.connected ?? false
  }
}

// Export a singleton instance
export const mqttManager = new MqttManager()
