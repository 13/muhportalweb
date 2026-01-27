<template>
  <v-app-bar :elevation="1">
    <template v-slot:prepend>
      <v-app-bar-nav-icon>
        <v-icon color="primary">mdi-cog</v-icon>
      </v-app-bar-nav-icon>
    </template>

    <v-app-bar-title class="text-h5">Einstellungen</v-app-bar-title>

    <template v-slot:append>
      <v-btn icon variant="text" to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </template>
  </v-app-bar>

  <v-container fluid class="d-flex justify-center pa-0 pa-md-6">
    <v-card class="w-100 ma-0" max-width="800">
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
  </v-container>
</template>

<script setup lang="ts">
const isDarkModeEnabled = ref(false);
const setDarkMode = inject<(enableDarkMode: boolean) => void>("setDarkMode");

onMounted(() => {
  isDarkModeEnabled.value = localStorage.getItem("darkMode") === "true";
});

const onDarkModeToggle = () => {
  localStorage.setItem("darkMode", isDarkModeEnabled.value.toString());
  if (setDarkMode) {
    setDarkMode(isDarkModeEnabled.value);
  }
};
</script>
