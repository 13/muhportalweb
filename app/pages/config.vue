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
    <div class="d-flex flex-column ga-4 w-100" style="max-width: 800px;">

      <v-card class="ma-0">
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

      <v-card class="ma-0">
        <v-card-title class="text-h6">About</v-card-title>

        <v-card-text>
          <div class="d-flex flex-column flex-sm-row align-center ga-4">
            <v-avatar size="88" rounded="lg" class="bg-white elevation-2">
              <v-img src="/muhportal.svg" alt="muhportalweb logo" />
            </v-avatar>

            <div class="flex-grow-1 text-center text-sm-left">
              <div class="text-h5 font-weight-bold">muhportalweb</div>
              <div class="text-body-1 text-medium-emphasis mt-2">
                MUH Portal Web is a lightweight home automation frontend for portal access,
                wake-on-lan and Home Assistant controls.
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-list density="comfortable">
          <v-list-item>
            <template #prepend>
              <v-icon>mdi-tag</v-icon>
            </template>
            <v-list-item-title>Version</v-list-item-title>
            <v-list-item-subtitle>{{ appVersion }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-rocket-launch</v-icon>
            </template>
            <v-list-item-title>Release</v-list-item-title>
            <v-list-item-subtitle>Stable client build</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-calendar-clock</v-icon>
            </template>
            <v-list-item-title>Build Date</v-list-item-title>
            <v-list-item-subtitle>{{ formattedBuildDate }}</v-list-item-subtitle>
          </v-list-item>

        </v-list>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import pkg from '../../package.json'

const appVersion = pkg.version
const buildDate = useRuntimeConfig().public.buildDate as string
const formattedBuildDate = new Date(buildDate).toLocaleString()
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
