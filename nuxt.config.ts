// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-01-25',
  devtools: { enabled: true },

  // Client-only app (for now, still needed for WebSocket on client)
  ssr: false,

  // Vuetify support
  build: {
    transpile: ['vuetify'],
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
