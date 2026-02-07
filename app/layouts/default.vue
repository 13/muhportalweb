<template>
  <v-app :theme="currentThemeName">
    <v-main>
      <slot />
    </v-main>
    <v-bottom-navigation app grow color="primary">
      <v-btn to="/" value="portal">
        <v-icon>mdi-lock</v-icon>
        <span>Portal</span>
      </v-btn>
      <v-btn to="/wol" value="wol">
        <v-icon>mdi-lan</v-icon>
        <span>WOL</span>
      </v-btn>
      <v-btn to="/ha" value="ha">
        <v-icon>mdi-lightbulb</v-icon>
        <span>HA</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()
const currentThemeName = ref('light')

onMounted(() => {
  const isDarkModeEnabled = localStorage.getItem('darkMode') === 'true'
  currentThemeName.value = isDarkModeEnabled ? 'dark' : 'light'
  vuetifyTheme.global.name.value = currentThemeName.value
})

// Expose theme updater for child components (e.g., config page)
provide('setDarkMode', (enableDarkMode: boolean) => {
  currentThemeName.value = enableDarkMode ? 'dark' : 'light'
  vuetifyTheme.global.name.value = currentThemeName.value
})
</script>
