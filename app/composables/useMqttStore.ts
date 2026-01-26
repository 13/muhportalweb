// Composable for storing MQTT data persistently on the frontend
// Data is only updated when new data comes in

// Global state that persists across component lifecycles
const mqttData = reactive<Record<string, string>>({})
const lastUpdated = reactive<Record<string, number>>({})

export function useMqttStore() {
  /**
   * Get stored data for a topic
   */
  const getData = (topic: string): string | undefined => {
    return mqttData[topic]
  }

  /**
   * Get all stored data
   */
  const getAllData = (): Record<string, string> => {
    return mqttData
  }

  /**
   * Store data for a topic, only if it's different from existing data
   * Returns true if data was updated, false if it was the same
   */
  const setData = (topic: string, message: string): boolean => {
    const existingData = mqttData[topic]
    
    // Only update if data is different
    if (existingData !== message) {
      mqttData[topic] = message
      lastUpdated[topic] = Date.now()
      return true
    }
    
    return false
  }

  /**
   * Get the timestamp when a topic was last updated
   */
  const getLastUpdated = (topic: string): number | undefined => {
    return lastUpdated[topic]
  }

  /**
   * Clear stored data for a specific topic
   */
  const clearTopic = (topic: string): void => {
    delete mqttData[topic]
    delete lastUpdated[topic]
  }

  /**
   * Clear all stored MQTT data
   */
  const clearAll = (): void => {
    Object.keys(mqttData).forEach((key) => {
      delete mqttData[key]
    })
    Object.keys(lastUpdated).forEach((key) => {
      delete lastUpdated[key]
    })
  }

  /**
   * Check if data exists for a topic
   */
  const hasData = (topic: string): boolean => {
    return topic in mqttData
  }

  return {
    mqttData,
    lastUpdated,
    getData,
    getAllData,
    setData,
    getLastUpdated,
    clearTopic,
    clearAll,
    hasData,
  }
}
