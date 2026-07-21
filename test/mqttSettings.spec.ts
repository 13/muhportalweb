import { describe, it, expect } from 'vitest'
import { defaultMqttSettings } from '../app/composables/useMqttSettings'

describe('defaultMqttSettings', () => {
  it('defines every topic and field path as a non-empty string', () => {
    for (const [key, value] of Object.entries(defaultMqttSettings)) {
      if (key === 'mqttUsername' || key === 'mqttPassword') continue
      expect(value, key).toBeTypeOf('string')
      expect(value.length, key).toBeGreaterThan(0)
    }
  })

  it('stored partial settings merge over defaults without losing new keys', () => {
    const stored = { mqttServer: 'mqtt://other:1883' }
    const merged = { ...defaultMqttSettings, ...stored }
    expect(merged.mqttServer).toBe('mqtt://other:1883')
    expect(merged.alarmSetPub).toBe(defaultMqttSettings.alarmSetPub)
    expect(Object.keys(merged).length).toBe(Object.keys(defaultMqttSettings).length)
  })
})
