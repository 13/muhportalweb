<template>
  <v-card class="mx-auto">
    <!-- Card Header -->
    <v-list-item>
      <template #prepend>
        <v-icon>mdi-cog</v-icon>
      </template>
      <v-list-item-title class="text-h6">Einstellungen</v-list-item-title>
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
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
const isDarkModeEnabled = ref(false)
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
</script>
