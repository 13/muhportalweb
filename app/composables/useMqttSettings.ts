const STORAGE_KEY = 'muhportal:mqtt-settings'

export interface MqttSettings {
  // Connection
  mqttServer: string
  mqttUsername: string
  mqttPassword: string

  // Portal (index.vue) topics
  portalSubscribeTopic: string
  portalPublishTopic: string

  // HA (ha.vue) topics
  haTemperaturTopic: string
  haPvTopic: string
  haPvShellyTopic: string
  haEnergyTopic: string
  haKommerSensorTopic: string
  haKommerStateTopic: string
  haKommerCmndTopic: string
  haBrennerTemp1Topic: string
  haBrennerTemp2Topic: string
  haBrennerStateTopic: string
  haBrennerCmndTopic: string

  // HA payload field paths
  haTemperaturFieldTemp: string
  haTemperaturFieldHumidity: string
  haPvFieldE1: string
  haPvFieldE2: string
  haPvFieldP1: string
  haPvFieldP2: string
  haPvShellyFieldPower: string
  haPvShellyFieldToday: string
  haEnergyFieldPower: string
  haEnergyFieldImport: string
  haEnergyFieldExport: string
  haKommerFieldTemp: string
  haKommerFieldHumidity: string
  haKommerStateField: string
  haBrennerFieldTemp: string
  haBrennerStateField: string

  // WOL (wol.vue) topics
  wolSubscribeTopic: string
  wolWakeTopic: string
  wolShutdownTopic: string
}

export const defaultMqttSettings: MqttSettings = {
  mqttServer: 'mqtt://192.168.22.5:1883',
  mqttUsername: '',
  mqttPassword: '',

  portalSubscribeTopic: 'muh/portal/+/json',
  portalPublishTopic: 'muh/portal/RLY/cmnd',

  haTemperaturTopic: 'muh/wst/data/B327',
  haPvTopic: 'muh/pv/E07000055917/json',
  haPvShellyTopic: 'tasmota/tele/tasmota_1B4444/SENSOR',
  haEnergyTopic: 'tasmota/tele/tasmota_5FF8B2/SENSOR',
  haKommerSensorTopic: 'muh/sensors/13/json',
  haKommerStateTopic: 'tasmota/tele/tasmota_BDC5E0/STATE',
  haKommerCmndTopic: 'tasmota/cmnd/tasmota_BDC5E0/POWER',
  haBrennerTemp1Topic: 'muh/sensors/HZ_WW/DS18B20-3628FF/json',
  haBrennerTemp2Topic: 'muh/sensors/HZ_WW/DS18B20-1C16E1/json',
  haBrennerStateTopic: 'tasmota/tele/tasmota_A7EEA3/STATE',
  haBrennerCmndTopic: 'tasmota/cmnd/tasmota_A7EEA3/POWER',

  haTemperaturFieldTemp: 'temp_c',
  haTemperaturFieldHumidity: 'humidity',
  haPvFieldE1: 'data.e1',
  haPvFieldE2: 'data.e2',
  haPvFieldP1: 'data.p1',
  haPvFieldP2: 'data.p2',
  haPvShellyFieldPower: 'ENERGY.Power',
  haPvShellyFieldToday: 'ENERGY.Today',
  haEnergyFieldPower: 'ENERGY.Power[0]',
  haEnergyFieldImport: 'ENERGY.TodaySumImport',
  haEnergyFieldExport: 'ENERGY.TodaySumExport',
  haKommerFieldTemp: 'T_SI',
  haKommerFieldHumidity: 'H_SI',
  haKommerStateField: 'POWER',
  haBrennerFieldTemp: 'DS18B20.Temperature',
  haBrennerStateField: 'POWER',

  wolSubscribeTopic: 'muh/pc/#',
  wolWakeTopic: 'muh/wol',
  wolShutdownTopic: 'muh/poweroff',
}

export function useMqttSettings() {
  const loadSettings = (): MqttSettings => {
    if (!import.meta.client) return { ...defaultMqttSettings }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return { ...defaultMqttSettings, ...JSON.parse(stored) }
    } catch {
      // ignore
    }
    return { ...defaultMqttSettings }
  }

  const saveSettings = (settings: MqttSettings) => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }

  return { loadSettings, saveSettings, defaultMqttSettings }
}
