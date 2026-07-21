import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
// @ts-expect-error css side-effect import ships no type declarations
import 'vuetify/styles'
import colors from 'vuetify/util/colors'

// Components and directives are auto-imported per-use by vite-plugin-vuetify
export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
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
