<template>
  <v-card height="100%">
    <!-- Card Header -->
    <v-list-item>
      <template #prepend>
        <v-icon>mdi-lan</v-icon>
      </template>
      <v-list-item-title class="text-h5">WOL</v-list-item-title>
      <template #append>
        <v-btn icon variant="text" @click="refreshData">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-btn icon variant="text" to="/config">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </template>
    </v-list-item>

    <!-- MQTT Connection Status -->
    <v-progress-linear
      class="mb-0"
      :model-value="100"
      :color="mqttConnectionStatusColor"
    />

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
    <v-list class="mx-auto" style="max-width: 600px;">
      <v-list-item
        v-for="(host, index) in hostsSortedByPriority"
        :key="index"
        :disabled="!host.mac"
        @click="openHostDialog(host)"
      >
        <v-list-item-title>{{ extractHostname(host.name) }}</v-list-item-title>
        <template #append>
          <v-btn
            :color="host.alive ? 'green' : 'red'"
            size="small"
            elevation="0"
          >
            {{ host.alive ? 'on' : 'off' }}
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <!-- Host Action Dialog -->
    <v-dialog v-model="isHostDialogVisible" max-width="480">
      <v-card>
        <v-card-title class="text-h5 bg-ternary text-center">
          {{ extractHostname(selectedHost?.name || '') }}
        </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row>
              <v-col>
                <v-btn block variant="text">
                  <v-icon start :color="selectedHost?.alive ? 'green' : 'red'">mdi-checkbox-blank</v-icon>
                  {{ selectedHost?.alive ? 'Online' : 'Offline' }}
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
                <v-btn block color="primary" @click="isHostDialogVisible = false">
                  Abbrechen
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { debugLog } from '../utils/logger'

interface NetworkHost {
  name: string
  ip: string
  mac: string
  alive: boolean
  priority: number
}

const { isConnected, connectToBroker, reconnectToBroker, subscribeToTopic, publishMessage } = useSocketIO()
const { extractHostname } = useHelpers()

const networkHosts = ref<NetworkHost[]>([])
const isNotificationVisible = ref(false)
const notificationMessage = ref('')
const isHostDialogVisible = ref(false)
const selectedHost = ref<NetworkHost | null>(null)

// Connection status color: green=connected, red=disconnected
const mqttConnectionStatusColor = computed(() => {
  return isConnected.value ? 'green' : 'red'
})

// Sort hosts by priority (lower number = higher priority)
const hostsSortedByPriority = computed(() => {
  return [...networkHosts.value].sort((a, b) => a.priority - b.priority)
})

const refreshData = () => {
  // Clear local state
  // networkHosts.value = []
  // Reconnect to MQTT
  reconnectToBroker()
}

const openHostDialog = (host: NetworkHost) => {
  if (host.mac) {
    selectedHost.value = host
    isHostDialogVisible.value = true
  }
}

const sendWakeOnLanCommand = () => {
  if (selectedHost.value?.mac) {
    debugLog.log(`WOL: Waking ${selectedHost.value.name} (${selectedHost.value.mac})`)
    publishMessage('muh/wol', JSON.stringify({ mac: selectedHost.value.mac }))
    notificationMessage.value = `Waking ${extractHostname(selectedHost.value.name)} ...`
    isNotificationVisible.value = true
  }
}

const sendShutdownCommand = () => {
  if (selectedHost.value?.mac) {
    debugLog.log(`WOL: Shutting down ${selectedHost.value.name} (${selectedHost.value.mac})`)
    publishMessage('muh/poweroff', JSON.stringify({ mac: selectedHost.value.mac }))
    notificationMessage.value = `Shutting down ${extractHostname(selectedHost.value.name)} ...`
    isNotificationVisible.value = true
  }
}

onMounted(() => {
  connectToBroker()

  // Subscribe to host status updates
  subscribeToTopic('muh/pc/#', (topic: string, message: Buffer) => {
    try {
      const hostData = JSON.parse(message.toString()) as NetworkHost
      // Update existing host or add new one
      if (hostData.name) {
        const existingHost = networkHosts.value.find((h) => h.name === hostData.name)
        if (existingHost) {
          existingHost.ip = hostData.ip
          existingHost.mac = hostData.mac
          existingHost.alive = hostData.alive
          existingHost.priority = hostData.priority
        } else {
          networkHosts.value.push({
            name: hostData.name,
            ip: hostData.ip,
            mac: hostData.mac,
            alive: hostData.alive,
            priority: hostData.priority,
          })
        }
      }
    } catch {
      // Invalid JSON payload - ignore
    }
  })
})
</script>
