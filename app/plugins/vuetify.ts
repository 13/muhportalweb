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
            ternary: colors.grey.lighten3,
          },
        },
        dark: {
          dark: true,
          colors: {
            primary: colors.blueGrey.lighten5,
            secondary: colors.blueGrey.darken4,
            ternary: colors.grey.darken3,
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
