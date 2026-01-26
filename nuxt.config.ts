// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-01-25',
  devtools: { enabled: true },


  // Client-only app
  ssr: false,

  // Vuetify support
  build: {
    transpile: ['vuetify'],
  },

  // Runtime environment variables
  runtimeConfig: {
    // Server-side MQTT broker URL (non-WebSocket)
    mqttUrl: process.env.MQTT_URL ?? 'mqtt://192.168.22.5:1883',
    public: {
      // WebSocket URL for frontend to connect to backend
      wsUrl: process.env.WS_URL ?? '',
    },
  },
  app: {
    head: {
      title: 'muhportalweb',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  server: {
    host: process.env.NUXT_HOST || '0.0.0.0',
    port: parseInt(process.env.NUXT_PORT) || 3000
  }
})
