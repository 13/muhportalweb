<template>
  <v-app-bar :elevation="1">
    <template #prepend>
      <v-app-bar-nav-icon :color="mqttConnectionStatusColor">
        <v-icon>mdi-lan</v-icon>
      </v-app-bar-nav-icon>
    </template>

    <v-app-bar-title class="text-h5">WOL</v-app-bar-title>

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
      <!-- Notification Snackbar -->
      <v-snackbar
        v-model="isNotificationVisible"
        :timeout="2000"
        color="green"
        location="top"
      >
        {{ notificationMessage }}
      </v-snackbar>

      <!-- Hosts List -->
      <v-list>
        <v-list-item
          v-for="(host, index) in hostsSortedByPriority"
          :key="index"
          :disabled="!host.mac"
          :class="{ 'opacity-50': isStale(host) }"
          @click="openHostDialog(host)"
        >
          <v-list-item-title>{{
            extractHostname(host.name)
          }}</v-list-item-title>
          <template #append>
            <v-btn
              :color="isStale(host) ? 'grey' : host.alive ? 'green' : 'red'"
              size="small"
              elevation="0"
            >
              {{ isStale(host) ? "stale" : host.alive ? "on" : "off" }}
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <!-- Host Action Dialog -->
      <v-dialog v-model="isHostDialogVisible" max-width="480">
        <v-card>
          <v-card-title class="text-h5 bg-ternary text-center">
            {{ extractHostname(selectedHost?.name || "") }}
          </v-card-title>
          <v-card-text>
            <v-container fluid>
              <v-row>
                <v-col>
                  <v-btn block variant="text">
                    <v-icon start :color="selectedHost?.alive ? 'green' : 'red'"
                      >mdi-checkbox-blank</v-icon
                    >
                    {{ selectedHost?.alive ? "Online" : "Offline" }}
                  </v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-btn block color="secondary" @click="sendWakeOnLanCommand">
                    <v-icon start>mdi-power</v-icon>
                    Wake
                  </v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-btn block color="secondary" @click="sendShutdownCommand">
                    <v-icon start>mdi-power</v-icon>
                    Shutdown
                  </v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-btn
                    block
                    color="primary"
                    @click="isHostDialogVisible = false"
                  >
                    Abbrechen
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { debugLog } from "../utils/logger";
import { parseJson } from "#shared/utils/mqtt";

interface NetworkHost {
  name: string;
  ip: string;
  mac: string;
  alive: boolean;
  priority?: number;
  lastSeen?: number;
}

const {
  statusColor: mqttConnectionStatusColor,
  connectToBroker,
  reconnectToBroker,
  subscribeToTopic,
  publishMessage,
} = useSocketIO();
const { extractHostname } = useHelpers();

const networkHosts = ref<NetworkHost[]>([]);

// Ticking clock so stale detection updates without new MQTT traffic
const STALE_AFTER_MS = 5 * 60 * 1000;
const now = ref(Date.now());
let staleTicker: ReturnType<typeof setInterval> | null = null;
const isStale = (host: NetworkHost) =>
  host.lastSeen !== undefined && now.value - host.lastSeen > STALE_AFTER_MS;
const isNotificationVisible = ref(false);
const notificationMessage = ref("");
const isHostDialogVisible = ref(false);
const selectedHost = ref<NetworkHost | null>(null);

// Sort hosts by priority ascending: 1 is highest and appears first.
// Hosts with no priority fall to the bottom.
const hostsSortedByPriority = computed(() => {
  return [...networkHosts.value].sort(
    (a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
  );
});

const refreshData = () => {
  // Clear local state
  // networkHosts.value = []
  // Reconnect to MQTT
  reconnectToBroker();
};

const openHostDialog = (host: NetworkHost) => {
  if (host.mac) {
    selectedHost.value = host;
    isHostDialogVisible.value = true;
  }
};

const { loadSettings } = useMqttSettings();
const mqttTopics = loadSettings();

const sendWakeOnLanCommand = () => {
  if (selectedHost.value?.mac) {
    debugLog.log(
      `WOL: Waking ${selectedHost.value.name} (${selectedHost.value.mac})`,
    );
    publishMessage(mqttTopics.wolWakeTopic, JSON.stringify({ mac: selectedHost.value.mac }));
    notificationMessage.value = `Waking ${extractHostname(selectedHost.value.name)} ...`;
    isNotificationVisible.value = true;
  }
};

const sendShutdownCommand = () => {
  if (selectedHost.value?.mac) {
    debugLog.log(
      `WOL: Shutting down ${selectedHost.value.name} (${selectedHost.value.mac})`,
    );
    publishMessage(
      mqttTopics.wolShutdownTopic,
      JSON.stringify({ mac: selectedHost.value.mac }),
    );
    notificationMessage.value = `Shutting down ${extractHostname(selectedHost.value.name)} ...`;
    isNotificationVisible.value = true;
  }
};

onUnmounted(() => {
  if (staleTicker) clearInterval(staleTicker);
});

onMounted(() => {
  connectToBroker();
  staleTicker = setInterval(() => {
    now.value = Date.now();
  }, 30_000);

  // Subscribe to host status updates
  subscribeToTopic(mqttTopics.wolSubscribeTopic, (topic: string, message: { toString(): string }) => {
    const hostData = parseJson<NetworkHost>(message.toString());
    if (hostData === null) return;
    // Update existing host or add new one
    if (hostData.name) {
      const existingHost = networkHosts.value.find(
        (h) => h.name === hostData.name,
      );
      if (existingHost) {
        existingHost.ip = hostData.ip;
        existingHost.mac = hostData.mac;
        existingHost.alive = hostData.alive;
        if (hostData.priority != null) {
          existingHost.priority = hostData.priority;
        }
      } else {
        networkHosts.value.push({
          name: hostData.name,
          ip: hostData.ip,
          mac: hostData.mac,
          alive: hostData.alive,
          priority: hostData.priority ?? undefined,
        });
      }
    }
  });
});
</script>
