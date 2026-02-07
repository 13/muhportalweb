<template>
  <v-app-bar :elevation="1">
    <template v-slot:prepend>
      <v-app-bar-nav-icon :color="mqttConnectionStatusColor">
        <v-icon>mdi-lightbulb</v-icon>
      </v-app-bar-nav-icon>
    </template>

    <v-app-bar-title class="text-h5">HA</v-app-bar-title>

    <template v-slot:append>
      <v-btn icon variant="text" @click="refreshData">
        <v-icon color="primary">mdi-refresh</v-icon>
      </v-btn>
      <v-btn icon variant="text" to="/config">
        <v-icon color="primary">mdi-cog</v-icon>
      </v-btn>
    </template>
  </v-app-bar>
  <!-- MQTT Connection Status -->
  <v-progress-linear
    class="mb-0"
    :model-value="100"
    :color="mqttConnectionStatusColor"
  />
  <v-container fluid class="d-flex justify-center pa-0 pa-md-6">
    <v-card class="w-100 ma-0" max-width="800">
      <v-list>
        <!-- Temperatur -->
        <v-list-item>
          <v-list-item-title>
            Temperatur {{ formatTemp(temperatur.temp) }} {{ formatHumidity(temperatur.humidity) }}
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <!-- Kommer -->
        <v-list-item>
          <v-list-item-title>
            Kommer {{ formatTemp(kommer.temp) }} {{ formatHumidity(kommer.humidity) }}
          </v-list-item-title>
          <template #append>
            <v-switch
              :model-value="kommerPower"
              color="green"
              hide-details
              density="compact"
              @update:model-value="toggleKommer"
            />
          </template>
        </v-list-item>

        <!-- Brenner -->
        <v-list-item>
          <v-list-item-title>
            Brenner {{ formatTemp(brenner.temp1) }} {{ formatTemp(brenner.temp2) }}
          </v-list-item-title>
          <template #append>
            <v-switch
              :model-value="brennerPower"
              color="green"
              hide-details
              density="compact"
              @update:model-value="toggleBrenner"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { debugLog } from "../utils/logger";

const {
  isConnected,
  connectToBroker,
  reconnectToBroker,
  subscribeToTopic,
  publishMessage,
} = useSocketIO();

// Sensor state
const temperatur = ref<{ temp: number | null; humidity: number | null }>({ temp: null, humidity: null });
const kommer = ref<{ temp: number | null; humidity: number | null }>({ temp: null, humidity: null });
const brenner = ref<{ temp1: number | null; temp2: number | null }>({ temp1: null, temp2: null });
const kommerPower = ref(false);
const brennerPower = ref(false);

const mqttConnectionStatusColor = computed(() => {
  return isConnected.value ? "green" : "red";
});

// Format temperature with comma decimal separator and degree sign
const formatTemp = (value: number | null): string => {
  if (value === null) return "--°";
  return value.toFixed(1).replace(".", ",") + "°";
};

// Format humidity with percent sign (no decimal)
const formatHumidity = (value: number | null): string => {
  if (value === null) return "--%";
  return Math.round(value) + "%";
};

const toggleKommer = (val: boolean) => {
  publishMessage("tasmota/cmnd/tasmota_BDC5E0/POWER", val ? "1" : "0");
};

const toggleBrenner = (val: boolean) => {
  publishMessage("tasmota/cmnd/tasmota_34AB95A7EEA3/POWER", val ? "1" : "0");
};

const refreshData = () => {
  reconnectToBroker();
};

onMounted(() => {
  connectToBroker();

  // Temperatur: muh/wst/data/B327
  subscribeToTopic("muh/wst/data/B327", (topic: string, message: { toString(): string }) => {
    try {
      const data = JSON.parse(message.toString());
      temperatur.value = { temp: data.temp_c ?? null, humidity: data.humidity ?? null };
    } catch {
      // ignore
    }
  });

  // Kommer sensor: muh/sensors/87/json
  subscribeToTopic("muh/sensors/87/json", (topic: string, message: { toString(): string }) => {
    try {
      const data = JSON.parse(message.toString());
      kommer.value = { temp: data.T1 ?? null, humidity: data.H1 ?? null };
    } catch {
      // ignore
    }
  });

  // Kommer switch state: tasmota/tele/tasmota_BDC5E0/STATE
  subscribeToTopic("tasmota/tele/tasmota_BDC5E0/STATE", (topic: string, message: { toString(): string }) => {
    try {
      const data = JSON.parse(message.toString());
      kommerPower.value = data.POWER === "ON";
    } catch {
      // ignore
    }
  });

  // Brenner temp 1: muh/sensors/HZ_WW/DS18B20-3628FF/json
  subscribeToTopic("muh/sensors/HZ_WW/DS18B20-3628FF/json", (topic: string, message: { toString(): string }) => {
    try {
      const data = JSON.parse(message.toString());
      brenner.value.temp1 = data.DS18B20?.Temperature ?? null;
    } catch {
      // ignore
    }
  });

  // Brenner temp 2: muh/sensors/HZ_WW/DS18B20-1C16E1/json
  subscribeToTopic("muh/sensors/HZ_WW/DS18B20-1C16E1/json", (topic: string, message: { toString(): string }) => {
    try {
      const data = JSON.parse(message.toString());
      brenner.value.temp2 = data.DS18B20?.Temperature ?? null;
    } catch {
      // ignore
    }
  });

  // Brenner switch state: tasmota/tele/tasmota_34AB95A7EEA3/STATE
  subscribeToTopic("tasmota/tele/tasmota_34AB95A7EEA3/STATE", (topic: string, message: { toString(): string }) => {
    try {
      const data = JSON.parse(message.toString());
      brennerPower.value = data.POWER === "ON";
    } catch {
      // ignore
    }
  });
});
</script>
