<template>
  <v-card class="mx-auto">
    <!-- Card Header -->
    <v-list-item>
      <template #prepend>
        <v-icon>mdi-cog</v-icon>
      </template>
      <v-list-item-title class="text-h5">Einstellungen</v-list-item-title>
      <template #append>
        <v-btn icon variant="text" to="/">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </template>
    </v-list-item>

    <v-divider />

    <v-list>
      <v-list-item>
        <template #prepend>
				  <v-icon>mdi-theme-light-dark</v-icon>
        </template>
        <v-list-item-title>Dark Mode</v-list-item-title>
        <template #append>
          <v-switch
            v-model="isDarkModeEnabled"
            hide-details
            @update:model-value="onDarkModeToggle"
          />
        </template>
      </v-list-item>

      <v-list-item>
        <template #prepend>
          <v-icon>mdi-database-remove</v-icon>
        </template>
        <v-list-item-title>MQTT Cache</v-list-item-title>
        <template #append>
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            @click="onClearMqttCache"
          >
            Löschen
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <!-- Notification Snackbar -->
    <v-snackbar
      v-model="isNotificationVisible"
      :timeout="2000"
      color="green"
      location="top"
    >
      {{ notificationMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
const { clearAll } = useMqttStore()

const isDarkModeEnabled = ref(false)
const isNotificationVisible = ref(false)
const notificationMessage = ref('')
const setDarkMode = inject<(enableDarkMode: boolean) => void>('setDarkMode')

onMounted(() => {
  isDarkModeEnabled.value = localStorage.getItem('darkMode') === 'true'
})

const onDarkModeToggle = () => {
  localStorage.setItem('darkMode', isDarkModeEnabled.value.toString())
  if (setDarkMode) {
    setDarkMode(isDarkModeEnabled.value)
  }
}

const onClearMqttCache = () => {
  clearAll()
  notificationMessage.value = 'MQTT Cache gelöscht'
  isNotificationVisible.value = true
}
</script>
