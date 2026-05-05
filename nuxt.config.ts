// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-01-25',
  devtools: { enabled: true },


  // SSR disabled for client-side reactivity
  ssr: false,

  // Vuetify support
  build: {
    transpile: ['vuetify'],
  },

  // Runtime environment variables
  runtimeConfig: {
    public: {
      // No runtime config needed - Socket.IO connects to same server
    },
  },
  app: {
    head: {
      title: 'muhportalweb',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/web-app-manifest-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/web-app-manifest-512x512.png' }
      ]
    }
  },
  server: {
    host: process.env.NUXT_HOST || '0.0.0.0',
    port: parseInt(process.env.NUXT_PORT) || 3000
  }
})
