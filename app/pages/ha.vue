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
          @click="openHostDialog(host)"
        >
          <v-list-item-title>{{
            extractHostname(host.name)
          }}</v-list-item-title>
          <template #append>
            <v-btn
              :color="host.alive ? 'green' : 'red'"
              size="small"
              elevation="0"
            >
              {{ host.alive ? "on" : "off" }}
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { debugLog } from "../utils/logger";

interface NetworkHost {
  name: string;
  ip: string;
  mac: string;
  alive: boolean;
  priority: number;
}

const {
  isConnected,
  connectToBroker,
  reconnectToBroker,
  subscribeToTopic,
  publishMessage,
} = useSocketIO();
const { extractHostname } = useHelpers();

const networkHosts = ref<NetworkHost[]>([]);
const isNotificationVisible = ref(false);
const notificationMessage = ref("");
const isHostDialogVisible = ref(false);
const selectedHost = ref<NetworkHost | null>(null);

// Connection status color: green=connected, red=disconnected
const mqttConnectionStatusColor = computed(() => {
  return isConnected.value ? "green" : "red";
});

const refreshData = () => {
  // Clear local state
  // networkHosts.value = []
  // Reconnect to MQTT
  reconnectToBroker();
};

onMounted(() => {
  connectToBroker();

  // Subscribe to host status updates
  subscribeToTopic("muh/pc/#", (topic: string, message: Buffer) => {
    try {
      const hostData = JSON.parse(message.toString()) as NetworkHost;
      // Update existing host or add new one
      if (hostData.name) {
        const existingHost = networkHosts.value.find(
          (h) => h.name === hostData.name,
        );
        if (existingHost) {
          existingHost.ip = hostData.ip;
          existingHost.mac = hostData.mac;
          existingHost.alive = hostData.alive;
          existingHost.priority = hostData.priority;
        } else {
          networkHosts.value.push({
            name: hostData.name,
            ip: hostData.ip,
            mac: hostData.mac,
            alive: hostData.alive,
            priority: hostData.priority,
          });
        }
      }
    } catch {
      // Invalid JSON payload - ignore
    }
  });
});
</script>
