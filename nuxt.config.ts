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
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ],
      style: [
        // Prevent white flash by setting initial background based on theme preference
        {
          children: `
            html, body, #__nuxt {
              background-color: #ECEFF1; /* Vuetify blueGrey.lighten5 - light theme secondary */
            }
            html.dark-mode, html.dark-mode body, html.dark-mode #__nuxt {
              background-color: #263238; /* Vuetify blueGrey.darken4 - dark theme secondary */
            }
          `
        }
      ],
      script: [
        // Immediately apply dark mode class if stored in localStorage (runs before Vue mounts)
        {
          children: `
            (function() {
              try {
                if (localStorage.getItem('darkMode') === 'true') {
                  document.documentElement.classList.add('dark-mode');
                }
              } catch (e) {
                // localStorage may be unavailable in private browsing mode
              }
            })();
          `,
          type: 'text/javascript'
        }
      ]
    }
  },
  server: {
    host: process.env.NUXT_HOST || '0.0.0.0',
    port: parseInt(process.env.NUXT_PORT) || 3000
  }
})
