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
    <div class="d-flex flex-column ga-4 w-100" style="max-width: 800px">
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

      <v-card class="ma-0 text-center">
        <v-card-text>
          <div class="d-flex flex-column align-center ga-4">
            <!-- Logo -->
            <v-avatar size="88" rounded="lg" class="bg-white elevation-2">
              <v-img src="/muhportal.svg" alt="muhportalweb logo" />
            </v-avatar>

            <!-- Name -->
            <div class="text-h5 font-weight-bold">muhportalweb</div>

            <!-- Description -->
            <div class="text-body-1 text-medium-emphasis">
              MUH Portal Web is a lightweight home automation frontend for
              portal access, wake-on-lan and Home Assistant controls.
            </div>
          </div>
        </v-card-text>

        <!-- Version + Build -->
        <v-card-text class="pt-0 text-center">
          <div class="text-body-2">
            Version: <span class="font-weight-bold">{{ appVersion }}</span>
          </div>
          <div class="text-body-2">
            Build Date: <span class="font-weight-bold">{{ formattedBuildDate }}</span>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import pkg from "../../package.json";

const appVersion = pkg.version;
const buildDate = useRuntimeConfig().public.buildDate as string;
const formatBuildDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const pad = (num: number) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formattedBuildDate = formatBuildDate(buildDate);
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
