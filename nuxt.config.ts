// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-25',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vite-pwa/nuxt',
    // Vuetify treeshaking: auto-import only the components actually used
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error vite config plugins array is typed readonly here
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],

  // SSR disabled for client-side reactivity
  ssr: false,

  vite: {
    vue: {
      template: { transformAssetUrls },
    },
  },

  // Runtime environment variables
  runtimeConfig: {
    public: {
      buildDate: new Date().toISOString(),
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

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'MUH Portal',
      short_name: 'MuhPortal',
      description: 'Home automation frontend',
      theme_color: '#263238',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      // Never intercept the live Socket.IO connection
      navigateFallbackDenylist: [/^\/socket\.io\//],
    },
    client: {
      installPrompt: true,
    },
  },
})
