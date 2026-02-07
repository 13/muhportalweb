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
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>Temperatur</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatTemp(temperatur.temp) }}
              </span>
              <span class="text-caption">
                {{ formatHumidity(temperatur.humidity) }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <!-- PV -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>PV</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatEnergy(pvShelly.power) }}
              </span>
              <span class="text-caption">
                {{ pv.e1 }}/{{ pv.e2 }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>PV Produktion</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatEnergyKwh(pvShelly.today) }}
              </span>
              <span class="text-caption">
                {{ pv.p1 }}/{{ pv.p2 }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <!-- Vebrauch -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>Verbrauch</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatEnergy(energy.power) }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <!-- Import -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>Import</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatEnergyKwh(energy.sumImport) }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <!-- Export -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>Export</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatEnergyKwh(energy.sumExport) }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <!-- PV Verbrauch -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>PV Verbrauch</span>

            <span class="d-flex align-center ga-2">
              <span class="font-weight-bold">
                {{ formatEnergyKwh(pvShelly.today - energy.sumExport) }}
              </span>
            </span>
          </v-list-item-title>
        </v-list-item>

        <v-divider />

        <!-- Kommer -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>Kommer</span>

            <span class="d-flex align-center ga-2 pr-4">
              <span class="font-weight-bold">
                {{ formatTemp(kommer.temp) }}
              </span>
              <span class="text-caption">
                {{ formatHumidity(kommer.humidity) }}
              </span>
            </span>
          </v-list-item-title>

          <template #append>
            <v-switch
              v-model="kommerPowerLocal"
              :disabled="!isConnected"
              color="green"
              hide-details
              density="compact"
              @update:model-value="toggleKommer"
            />
          </template>
        </v-list-item>

        <!-- Brenner -->
        <v-list-item>
          <v-list-item-title
            class="d-flex justify-space-between align-center w-100"
          >
            <span>Brenner</span>

            <span class="d-flex align-center ga-2 pr-4">
              <span class="font-weight-bold">
                {{ formatTemp(brenner.temp1) }}
              </span>
              <span class="text-caption">
                {{ formatTemp(brenner.temp2) }}
              </span>
            </span>
          </v-list-item-title>

          <template #append>
            <v-switch
              v-model="brennerPowerLocal"
              :disabled="!isConnected"
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
const pv = ref<{ e1: number | null; e2: number; p1: number; p2: number | null }>({
  e1: null,
  e2: null,
  p1: null,
  p2: null,
});
const energy = ref<{ power: number | null; sumImport: number; sumExport: number | null }>({
  power: null,
  sumImport: null,
  sumExport: null,
});
const pvShelly = ref<{ power: number | null; today: number | null }>({
  power: null,
  today: null,
});
const temperatur = ref<{ temp: number | null; humidity: number | null }>({
  temp: null,
  humidity: null,
});
const kommer = ref<{ temp: number | null; humidity: number | null }>({
  temp: null,
  humidity: null,
});
const brenner = ref<{ temp1: number | null; temp2: number | null }>({
  temp1: null,
  temp2: null,
});

const kommerPower = ref(false);
const brennerPower = ref(false);
const kommerPowerLocal = ref(false);
const brennerPowerLocal = ref(false);

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

// Format energy
const formatEnergy = (value: number | null): string => {
  if (value === null) return "-- W";
  return value.toFixed(0).replace(".", ",") + " W";
};
const formatEnergyKwh = (value: number | null): string => {
  if (value === null) return "-- kWh";
  return value.toFixed(1).replace(".", ",") + " kWh";
};

const toggleKommer = (val: boolean) => {
  publishMessage("tasmota/cmnd/tasmota_BDC5E0/POWER", val ? "1" : "0");
};

const toggleBrenner = (val: boolean) => {
  publishMessage("tasmota/cmnd/tasmota_A7EEA3/POWER", val ? "1" : "0");
};

const refreshData = () => {
  reconnectToBroker();
};

onMounted(() => {
  connectToBroker();

  // Temperatur: muh/wst/data/B327
  subscribeToTopic(
    "muh/wst/data/B327",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        temperatur.value = {
          temp: data.temp_c ?? null,
          humidity: data.humidity ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  // PV 
  subscribeToTopic(
    "muh/pv/E07000055917/json",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        pv.value = {
          e1: data.e1 ?? null,
          e2: data.e2 ?? null,
          p1: data.p1 ?? null,
          p2: data.p2 ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  // 3EM: tasmota/tele/tasmota_5FF8B2/SENSOR
  subscribeToTopic(
    "tasmota/tele/tasmota_1B4444/SENSOR",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        pvShelly.value = {
          power: data.ENERGY.Power ?? null,
          today: data.ENERGY.Today ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  // 3EM: tasmota/tele/tasmota_5FF8B2/SENSOR
  subscribeToTopic(
    "tasmota/tele/tasmota_5FF8B2/SENSOR",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        energy.value = {
          power: data.ENERGY.Power[0] ?? null,
          sumImport: data.ENERGY.TodaySumImport ?? null,
          sumExport: data.ENERGY.TodaySumExport ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  // Kommer sensor: muh/sensors/87/json
  subscribeToTopic(
    "muh/sensors/87/json",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        kommer.value = { temp: data.T1 ?? null, humidity: data.H1 ?? null };
      } catch {
        // ignore
      }
    },
  );

  // Kommer switch state: tasmota/tele/tasmota_BDC5E0/STATE
  subscribeToTopic(
    "tasmota/tele/tasmota_BDC5E0/STATE",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        const power = data.POWER === "ON";

        kommerPower.value = power; // MQTT truth
        kommerPowerLocal.value = power; // sync UI
      } catch {
        // ignore
      }
    },
  );

  // Brenner temp 1: muh/sensors/HZ_WW/DS18B20-3628FF/json
  subscribeToTopic(
    "muh/sensors/HZ_WW/DS18B20-3628FF/json",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        brenner.value.temp1 = data.DS18B20?.Temperature ?? null;
      } catch {
        // ignore
      }
    },
  );

  // Brenner temp 2: muh/sensors/HZ_WW/DS18B20-1C16E1/json
  subscribeToTopic(
    "muh/sensors/HZ_WW/DS18B20-1C16E1/json",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        brenner.value.temp2 = data.DS18B20?.Temperature ?? null;
      } catch {
        // ignore
      }
    },
  );

  // Brenner switch state: tasmota/tele/tasmota_A7EEA3/STATE
  subscribeToTopic(
    "tasmota/tele/tasmota_A7EEA3/STATE",
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        const power = data.POWER === "ON";

        brennerPower.value = power;
        brennerPowerLocal.value = power;
      } catch {
        // ignore
      }
    },
  );
});
</script>
