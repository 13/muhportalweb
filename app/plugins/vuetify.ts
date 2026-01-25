import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import colors from 'vuetify/util/colors'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: colors.blueGrey.darken4,
            secondary: colors.blueGrey.lighten5,
            /*accent: '#82B1FF',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FFC107',
            background: '#FAFAFA',
            surface: '#FFFFFF',
            'surface-variant': '#EEEEEE',
            'on-surface': '#212121',
            'on-background': '#212121',*/
          },
        },
        dark: {
          dark: true,
          colors: {
            primary: colors.blueGrey.lighten5,
            secondary: colors.blueGrey.darken4,
            /*accent: '#FF80AB',
            error: '#FF5252',
            info: '#64B5F6',
            success: '#69F0AE',
            warning: '#FFD740',
            background: '#121212',
            surface: '#1E1E1E',
            'surface-variant': '#2D2D2D',
            'on-surface': '#E0E0E0',
            'on-background': '#E0E0E0',*/
          },
        },
      },
    },
    icons: {
      defaultSet: 'mdi',
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
