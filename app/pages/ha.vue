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
                {{ formatEnergy1(pv.p1) }}/{{ formatEnergy1(pv.p2) }}
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
                {{ formatEnergyKwh1(pv.e1) }}/{{ formatEnergyKwh1(pv.e2) }}
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
const pv = ref<{ e1: number | null; e2: number | null; p1: number | null; p2: number | null }>({
  e1: null,
  e2: null,
  p1: null,
  p2: null,
});
const energy = ref<{ power: number | null; sumImport: number | null; sumExport: number | null }>({
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
const formatEnergy1 = (value: number | null): string => {
  if (value === null) return "--";
  return value.toFixed(0).replace(".", ",");
};
const formatEnergyKwh1 = (value: number | null): string => {
  if (value === null) return "--";
  return value.toFixed(1).replace(".", ",");
};

const { loadSettings } = useMqttSettings();
const mqttTopics = loadSettings();

// Resolves dot/bracket paths like 'ENERGY.Power[0]' or 'DS18B20.Temperature'
const getPath = (obj: any, path: string): any =>
  path.split(/[.[\]]/).filter(Boolean).reduce((cur: any, key: string) => cur?.[key], obj)

const toggleKommer = (val: boolean) => {
  publishMessage(mqttTopics.haKommerCmndTopic, val ? "1" : "0");
};

const toggleBrenner = (val: boolean) => {
  publishMessage(mqttTopics.haBrennerCmndTopic, val ? "1" : "0");
};

const refreshData = () => {
  reconnectToBroker();
};

onMounted(() => {
  connectToBroker();

  subscribeToTopic(
    mqttTopics.haTemperaturTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        temperatur.value = {
          temp: getPath(data, mqttTopics.haTemperaturFieldTemp) ?? null,
          humidity: getPath(data, mqttTopics.haTemperaturFieldHumidity) ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haPvTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        pv.value = {
          e1: getPath(data, mqttTopics.haPvFieldE1) ?? null,
          e2: getPath(data, mqttTopics.haPvFieldE2) ?? null,
          p1: getPath(data, mqttTopics.haPvFieldP1) ?? null,
          p2: getPath(data, mqttTopics.haPvFieldP2) ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haPvShellyTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        pvShelly.value = {
          power: getPath(data, mqttTopics.haPvShellyFieldPower) ?? null,
          today: getPath(data, mqttTopics.haPvShellyFieldToday) ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haEnergyTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        energy.value = {
          power: getPath(data, mqttTopics.haEnergyFieldPower) ?? null,
          sumImport: getPath(data, mqttTopics.haEnergyFieldImport) ?? null,
          sumExport: getPath(data, mqttTopics.haEnergyFieldExport) ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haKommerSensorTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        kommer.value = {
          temp: getPath(data, mqttTopics.haKommerFieldTemp) ?? null,
          humidity: getPath(data, mqttTopics.haKommerFieldHumidity) ?? null,
        };
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haKommerStateTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        const power = getPath(data, mqttTopics.haKommerStateField) === "ON";
        kommerPower.value = power;
        kommerPowerLocal.value = power;
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haBrennerTemp1Topic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        brenner.value.temp1 = getPath(data, mqttTopics.haBrennerFieldTemp) ?? null;
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haBrennerTemp2Topic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        brenner.value.temp2 = getPath(data, mqttTopics.haBrennerFieldTemp) ?? null;
      } catch {
        // ignore
      }
    },
  );

  subscribeToTopic(
    mqttTopics.haBrennerStateTopic,
    (topic: string, message: { toString(): string }) => {
      try {
        const data = JSON.parse(message.toString());
        const power = getPath(data, mqttTopics.haBrennerStateField) === "ON";
        brennerPower.value = power;
        brennerPowerLocal.value = power;
      } catch {
        // ignore
      }
    },
  );
});
</script>
