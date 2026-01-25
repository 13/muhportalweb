// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-01-25',
  devtools: { enabled: true },

  // Client-only app (required for MQTT WebSocket usage)
  ssr: false,

  // Vuetify support
  build: {
    transpile: ['vuetify'],
  },

  // Runtime environment variables
  runtimeConfig: {
    public: {
      mqttWsUrl: process.env.MQTT_WS_URL ?? 'ws://192.168.22.5:1884',
    },
  },
})
