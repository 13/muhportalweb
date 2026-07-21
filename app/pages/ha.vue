<template>
  <v-app-bar :elevation="1">
    <template #prepend>
      <v-app-bar-nav-icon :color="mqttConnectionStatusColor">
        <v-icon>mdi-lightbulb</v-icon>
      </v-app-bar-nav-icon>
    </template>

    <v-app-bar-title class="text-h5">HA</v-app-bar-title>

    <template #append>
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
        <HaSensorList
          :temperatur="temperatur"
          :pv="pv"
          :pv-shelly="pvShelly"
          :energy="energy"
          :pv-consumption="pvConsumption"
        />

        <v-divider />

        <HaSwitchRow
          v-model="kommerPowerLocal"
          title="Kommer"
          :primary-text="formatTemp(kommer.temp)"
          :secondary-text="formatHumidity(kommer.humidity)"
          :disabled="controlsDisabled"
          @update:model-value="toggleKommer"
        />

        <HaSwitchRow
          v-model="brennerPowerLocal"
          title="Brenner"
          :primary-text="formatTemp(brenner.temp1)"
          :secondary-text="formatTemp(brenner.temp2)"
          :disabled="controlsDisabled"
          @update:model-value="toggleBrenner"
        />

        <v-divider />

        <HaAlarmCard
          :armed="armed"
          :at-home="atHome"
          :disabled="controlsDisabled"
          :alerts="alarmAlerts"
          @toggle-alarm="toggleAlarm"
          @toggle-at-home="toggleAlarmAtHome"
        />

        <v-divider />

        <HaAwaySim
          v-model:schedule-start="awaySimScheduleStart"
          v-model:schedule-end="awaySimScheduleEnd"
          :manual-active="awaySimManualActive"
          :schedule-enabled="awaySimScheduleEnabled"
          :disabled="controlsDisabled"
          @toggle-manual="toggleAwaySimManual"
          @toggle-schedule="toggleAwaySimSchedule"
          @publish-start="publishScheduleStart"
          @publish-end="publishScheduleEnd"
        />
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { parseJson } from "#shared/utils/mqtt";
import type { AlarmState, AlarmAlert, AwaySimStatus } from "#shared/types/ha";

const {
  isConnected,
  brokerConnected,
  statusColor: mqttConnectionStatusColor,
  connectToBroker,
  reconnectToBroker,
  subscribeToTopic,
  publishMessage,
} = useSocketIO();

const controlsDisabled = computed(() => !isConnected.value || !brokerConnected.value);

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

const alarmState = ref<AlarmState | null>(null);
const alarmAlerts = ref<AlarmAlert[]>([]);

const armed = computed(() => alarmState.value === 'ARM_AWAY' || alarmState.value === 'ARM_HOME');
const atHome = computed(() => alarmState.value === 'ARM_HOME');

const awaySimManualActive = ref(false);
const awaySimScheduleEnabled = ref(false);
const awaySimScheduleStart = ref('15:00');
const awaySimScheduleEnd = ref('06:00');

const pvConsumption = computed(() =>
  pvShelly.value.today !== null && energy.value.sumExport !== null
    ? pvShelly.value.today - energy.value.sumExport
    : null,
);

const { loadSettings } = useMqttSettings();
const mqttTopics = loadSettings();

// Resolves dot/bracket paths like 'ENERGY.Power[0]' or 'DS18B20.Temperature'
const getPath = (obj: any, path: string): any =>
  path.split(/[.[\]]/).filter(Boolean).reduce((cur: any, key: string) => cur?.[key], obj)

const toggleKommer = (val: boolean | null) => {
  publishMessage(mqttTopics.haKommerCmndTopic, val ? "1" : "0");
};

const toggleBrenner = (val: boolean | null) => {
  publishMessage(mqttTopics.haBrennerCmndTopic, val ? "1" : "0");
};

// Optimistic alarm UI with rollback: if the broker does not echo the new state
// on the state topic within the timeout, revert to the last confirmed state
const ALARM_ECHO_TIMEOUT_MS = 5000;
let lastConfirmedAlarmState: AlarmState | null = null;
let alarmEchoTimer: ReturnType<typeof setTimeout> | null = null;

const setAlarm = (state: AlarmState) => {
  publishMessage(mqttTopics.alarmSetPub, state, { qos: 1, retain: false });
  if (alarmEchoTimer) clearTimeout(alarmEchoTimer);
  alarmEchoTimer = setTimeout(() => {
    alarmState.value = lastConfirmedAlarmState;
  }, ALARM_ECHO_TIMEOUT_MS);
};

const toggleAlarm = (val: boolean | null) => {
  const state = val ? 'ARM_AWAY' : 'DISARM';
  alarmState.value = state;
  setAlarm(state);
};

const toggleAlarmAtHome = (val: boolean | null) => {
  const state = val ? 'ARM_HOME' : (armed.value ? 'ARM_AWAY' : 'DISARM');
  alarmState.value = state;
  setAlarm(state);
};

const toggleAwaySimManual = (val: boolean | null) => {
  awaySimManualActive.value = !!val;
  publishMessage(mqttTopics.awaySimManualSetPub, val ? 'ON' : 'OFF');
};

const toggleAwaySimSchedule = (val: boolean | null) => {
  awaySimScheduleEnabled.value = !!val;
  publishMessage(mqttTopics.awaySimScheduleSetPub, val ? 'ON' : 'OFF');
};

const publishScheduleStart = () => {
  publishMessage(mqttTopics.awaySimScheduleStartSetPub, awaySimScheduleStart.value);
};

const publishScheduleEnd = () => {
  publishMessage(mqttTopics.awaySimScheduleEndSetPub, awaySimScheduleEnd.value);
};

const refreshData = () => {
  reconnectToBroker();
};

onUnmounted(() => {
  if (alarmEchoTimer) clearTimeout(alarmEchoTimer);
});

onMounted(() => {
  connectToBroker();

  subscribeToTopic(
    mqttTopics.haTemperaturTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      temperatur.value = {
        temp: getPath(data, mqttTopics.haTemperaturFieldTemp) ?? null,
        humidity: getPath(data, mqttTopics.haTemperaturFieldHumidity) ?? null,
      };
    },
  );

  subscribeToTopic(
    mqttTopics.haPvTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      pv.value = {
        e1: getPath(data, mqttTopics.haPvFieldE1) ?? null,
        e2: getPath(data, mqttTopics.haPvFieldE2) ?? null,
        p1: getPath(data, mqttTopics.haPvFieldP1) ?? null,
        p2: getPath(data, mqttTopics.haPvFieldP2) ?? null,
      };
    },
  );

  subscribeToTopic(
    mqttTopics.haPvShellyTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      pvShelly.value = {
        power: getPath(data, mqttTopics.haPvShellyFieldPower) ?? null,
        today: getPath(data, mqttTopics.haPvShellyFieldToday) ?? null,
      };
    },
  );

  subscribeToTopic(
    mqttTopics.haEnergyTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      energy.value = {
        power: getPath(data, mqttTopics.haEnergyFieldPower) ?? null,
        sumImport: getPath(data, mqttTopics.haEnergyFieldImport) ?? null,
        sumExport: getPath(data, mqttTopics.haEnergyFieldExport) ?? null,
      };
    },
  );

  subscribeToTopic(
    mqttTopics.haKommerSensorTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      kommer.value = {
        temp: getPath(data, mqttTopics.haKommerFieldTemp) ?? null,
        humidity: getPath(data, mqttTopics.haKommerFieldHumidity) ?? null,
      };
    },
  );

  subscribeToTopic(
    mqttTopics.haKommerStateTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      const power = getPath(data, mqttTopics.haKommerStateField) === "ON";
      kommerPower.value = power;
      kommerPowerLocal.value = power;
    },
  );

  subscribeToTopic(
    mqttTopics.haBrennerTemp1Topic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      brenner.value.temp1 = getPath(data, mqttTopics.haBrennerFieldTemp) ?? null;
    },
  );

  subscribeToTopic(
    mqttTopics.haBrennerTemp2Topic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      brenner.value.temp2 = getPath(data, mqttTopics.haBrennerFieldTemp) ?? null;
    },
  );

  subscribeToTopic(
    mqttTopics.haBrennerStateTopic,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson(message.toString());
      if (data === null) return;
      const power = getPath(data, mqttTopics.haBrennerStateField) === "ON";
      brennerPower.value = power;
      brennerPowerLocal.value = power;
    },
  );

  subscribeToTopic(
    mqttTopics.alarmStateSub,
    (topic: string, message: { toString(): string }) => {
      const payload = message.toString().trim() as AlarmState;
      if (payload === 'ARM_AWAY' || payload === 'ARM_HOME' || payload === 'DISARM') {
        alarmState.value = payload;
        lastConfirmedAlarmState = payload;
        if (alarmEchoTimer) {
          clearTimeout(alarmEchoTimer);
          alarmEchoTimer = null;
        }
      }
    },
  );

  subscribeToTopic(
    mqttTopics.alarmAlertSub,
    (topic: string, message: { toString(): string }) => {
      const alert = parseJson<AlarmAlert>(message.toString());
      if (alert === null) return;
      alarmAlerts.value = [alert, ...alarmAlerts.value].slice(0, 50);
    },
  );

  subscribeToTopic(
    mqttTopics.awaySimStatusSub,
    (topic: string, message: { toString(): string }) => {
      const data = parseJson<AwaySimStatus>(message.toString());
      if (data === null) return;
      awaySimManualActive.value = data.manual_active;
      awaySimScheduleEnabled.value = data.schedule_enabled;
      awaySimScheduleStart.value = data.schedule_start;
      awaySimScheduleEnd.value = data.schedule_end;
    },
  );
});
</script>
