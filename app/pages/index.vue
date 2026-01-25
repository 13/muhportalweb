<template>
  <v-card class="mx-auto">
    <!-- Card Header -->
    <v-list-item>
      <template #prepend>
        <v-icon>mdi-lock</v-icon>
      </template>
      <v-list-item-title class="text-h6">Portal</v-list-item-title>
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
      :timeout="2500"
      color="green-lighten-1"
      location="top"
    >
      {{ notificationMessage }}
    </v-snackbar>

    <!-- Portal List -->
    <v-list>
      <!-- House Door (HD + HDL) - First -->
      <v-list-item v-if="portalStates.HD" disabled>
        <v-list-item-title class="text-h6">Haustür</v-list-item-title>
        <template #append>
          <v-chip label size="small">
            {{ formatRelativeDateTime(portalStates.HD?.time) }}
          </v-chip>
          <v-chip v-if="portalStates.HDL" label size="small" class="ml-2">
            {{ formatRelativeDateTime(portalStates.HDL?.time) }}
          </v-chip>
        </template>
      </v-list-item>
      <v-container v-if="portalStates.HD" fluid class="pa-0">
        <v-row no-gutters align="center" justify="center">
          <v-col cols="12" sm="6">
            <v-list-item @click="dialogVisibility.houseDoor = true">
              <template #prepend>
                <v-icon :color="getStateIndicatorColor(portalStates.HD?.state)">mdi-checkbox-blank</v-icon>
              </template>
              <v-list-item-title class="text-h6">
                {{ getDoorStateText(portalStates.HD?.state) }}
              </v-list-item-title>
            </v-list-item>
          </v-col>
          <v-col v-if="portalStates.HDL">
            <v-list-item @click="dialogVisibility.houseDoor = true">
              <template #prepend>
                <v-icon :color="getStateIndicatorColor(portalStates.HDL?.state)">mdi-checkbox-blank</v-icon>
              </template>
              <v-list-item-title class="text-h6">
                {{ getDoorLockStateText(portalStates.HDL?.state) }}
              </v-list-item-title>
            </v-list-item>
          </v-col>
        </v-row>
      </v-container>

      <!-- Garage Door (GD + GDL) - Second -->
      <v-list-item v-if="portalStates.GD" disabled>
        <v-list-item-title class="text-h6">Garagentür</v-list-item-title>
        <template #append>
          <v-chip label size="small">
            {{ formatRelativeDateTime(portalStates.GD?.time) }}
          </v-chip>
          <v-chip v-if="portalStates.GDL" label size="small" class="ml-2">
            {{ formatRelativeDateTime(portalStates.GDL?.time) }}
          </v-chip>
        </template>
      </v-list-item>
      <v-container v-if="portalStates.GD" fluid class="pa-0">
        <v-row no-gutters align="center" justify="center">
          <v-col cols="12" sm="6">
            <v-list-item @click="dialogVisibility.garageDoor = true">
              <template #prepend>
                <v-icon :color="getStateIndicatorColor(portalStates.GD?.state)">mdi-checkbox-blank</v-icon>
              </template>
              <v-list-item-title class="text-h6">
                {{ getDoorStateText(portalStates.GD?.state) }}
              </v-list-item-title>
            </v-list-item>
          </v-col>
          <v-col v-if="portalStates.GDL">
            <v-list-item @click="dialogVisibility.garageDoor = true">
              <template #prepend>
                <v-icon :color="getStateIndicatorColor(portalStates.GDL?.state)">mdi-checkbox-blank</v-icon>
              </template>
              <v-list-item-title class="text-h6">
                {{ getDoorLockStateText(portalStates.GDL?.state) }}
              </v-list-item-title>
            </v-list-item>
          </v-col>
        </v-row>
      </v-container>

      <!-- Garage (G) - Third -->
      <v-list-item v-if="portalStates.G" disabled>
        <v-list-item-title class="text-h6">Garage</v-list-item-title>
        <template #append>
          <v-chip label size="small">
            {{ formatRelativeDateTime(portalStates.G?.time) }}
          </v-chip>
        </template>
      </v-list-item>
      <v-container v-if="portalStates.G" fluid class="pa-0">
        <v-row no-gutters align="center" justify="center">
          <v-col>
            <v-list-item @click="dialogVisibility.garage = true">
              <template #prepend>
                <v-icon :color="getStateIndicatorColor(portalStates.G?.state)">mdi-checkbox-blank</v-icon>
              </template>
              <v-list-item-title class="text-h6">
                {{ getDoorStateText(portalStates.G?.state) }}
              </v-list-item-title>
            </v-list-item>
          </v-col>
        </v-row>
      </v-container>
    </v-list>

    <!-- Garage Dialog -->
    <v-dialog v-model="dialogVisibility.garage" max-width="480">
      <v-card>
        <v-card-title class="text-h5 bg-grey-lighten-2 text-center">
          Garage
        </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row>
              <v-col>
                <v-btn block variant="text">
                  <v-icon start :color="getStateIndicatorColor(portalStates.G?.state)">mdi-checkbox-blank</v-icon>
                  {{ getDoorStateText(portalStates.G?.state) }}
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block @click="sendPortalCommand('G', 'T')">
                  <v-icon start>mdi-arrow-up-down-bold</v-icon>
                  Bewegen
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block color="grey-darken-3" @click="dialogVisibility.garage = false">
                  Abbrechen
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Garage Door Dialog -->
    <v-dialog v-model="dialogVisibility.garageDoor" max-width="480">
      <v-card>
        <v-card-title class="text-h5 bg-grey-lighten-2 text-center">
          Garagentür
        </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row>
              <v-col>
                <v-btn block variant="text">
                  <v-icon start :color="getStateIndicatorColor(portalStates.GD?.state)">mdi-checkbox-blank</v-icon>
                  {{ getDoorStateText(portalStates.GD?.state) }}
                </v-btn>
              </v-col>
              <v-col v-if="portalStates.GDL">
                <v-btn block variant="text">
                  <v-icon start :color="getStateIndicatorColor(portalStates.GDL?.state)">mdi-checkbox-blank</v-icon>
                  {{ getDoorLockStateText(portalStates.GDL?.state) }}
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block @click="sendPortalCommand('GD', 'O')">
                  <v-icon start>mdi-door-open</v-icon>
                  Öffnen
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block @click="sendPortalCommand('GD', 'U')">
                  <v-icon start>mdi-lock-open-variant</v-icon>
                  Entriegeln
                </v-btn>
              </v-col>
              <v-col>
                <v-btn block @click="sendPortalCommand('GD', 'L')">
                  <v-icon start>mdi-lock</v-icon>
                  Verriegeln
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block color="grey-darken-3" @click="dialogVisibility.garageDoor = false">
                  Abbrechen
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- House Door Dialog -->
    <v-dialog v-model="dialogVisibility.houseDoor" max-width="480">
      <v-card>
        <v-card-title class="text-h5 bg-grey-lighten-2 text-center">
          Haustür
        </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row>
              <v-col>
                <v-btn block variant="text">
                  <v-icon start :color="getStateIndicatorColor(portalStates.HD?.state)">mdi-checkbox-blank</v-icon>
                  {{ getDoorStateText(portalStates.HD?.state) }}
                </v-btn>
              </v-col>
              <v-col v-if="portalStates.HDL">
                <v-btn block variant="text">
                  <v-icon start :color="getStateIndicatorColor(portalStates.HDL?.state)">mdi-checkbox-blank</v-icon>
                  {{ getDoorLockStateText(portalStates.HDL?.state) }}
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block @click="sendPortalCommand('HD', 'O')">
                  <v-icon start>mdi-door-open</v-icon>
                  Öffnen
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block @click="sendPortalCommand('HD', 'U')">
                  <v-icon start>mdi-lock-open-variant</v-icon>
                  Entriegeln
                </v-btn>
              </v-col>
              <v-col>
                <v-btn block @click="sendPortalCommand('HD', 'L')">
                  <v-icon start>mdi-lock</v-icon>
                  Verriegeln
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn block color="grey-darken-3" @click="dialogVisibility.houseDoor = false">
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
interface PortalState {
  state: number
  time: string
}

interface Portals {
  G?: PortalState    // Garage
  GD?: PortalState   // Garage Door
  GDL?: PortalState  // Garage Door Lock
  HD?: PortalState   // House Door
  HDL?: PortalState  // House Door Lock
}

const { isConnected, connectToBroker, reconnectToBroker, subscribeToTopic, publishMessage } = useMqtt()
const {
  getStateIndicatorColor,
  getDoorStateText,
  getDoorLockStateText,
  formatRelativeDateTime,
} = useHelpers()

const portalStates = reactive<Portals>({})
const isNotificationVisible = ref(false)
const notificationMessage = ref('')

// Connection status color: green=connected, red=disconnected
const mqttConnectionStatusColor = computed(() => {
  return isConnected.value ? 'green' : 'red'
})

// Dialog visibility states
const dialogVisibility = reactive({
  garage: false,
  garageDoor: false,
  houseDoor: false,
})

const refreshData = () => {
  // Clear local state
  // Object.keys(portalStates).forEach((key) => delete portalStates[key as keyof Portals])
  // Reconnect to MQTT
  reconnectToBroker()
}

const getActionDisplayText = (actionCode: string) => {
  switch (actionCode) {
    case 'T': return 'Bewegen'
    case 'O': return 'Öffnen'
    case 'L': return 'Verriegeln'
    case 'U': return 'Entriegeln'
    default: return actionCode
  }
}

const getPortalDisplayName = (portalCode: string) => {
  switch (portalCode) {
    case 'G': return 'Garage'
    case 'GD': return 'Garagentür'
    case 'GDL': return 'Garagentür Riegel'
    case 'HD': return 'Haustür'
    case 'HDL': return 'Haustür Riegel'
    default: return portalCode
  }
}

const sendPortalCommand = (portalCode: string, actionCode: string) => {
  console.log(`Portal command: ${portalCode} ${actionCode}`)
  publishMessage('muh/portal/RLY/cmnd', `${portalCode}_${actionCode}`)
  notificationMessage.value = `${getPortalDisplayName(portalCode)} ${getActionDisplayText(actionCode)} ...`
  isNotificationVisible.value = true
}

onMounted(() => {
  connectToBroker()

  // Subscribe to portal state updates (G, GD, GDL, HD, HDL)
  subscribeToTopic('muh/portal/+/json', (topic: string, message: Buffer) => {
    const topicMatch = topic.match(/muh\/portal\/([A-Z]+)\/json/)
    if (topicMatch) {
      try {
        const portalCode = topicMatch[1] as keyof Portals
        const stateData = JSON.parse(message.toString()) as PortalState
        portalStates[portalCode] = {
          state: stateData.state,
          time: stateData.time,
        }
      } catch {
        // Invalid JSON payload - ignore
      }
    }
  })
})
</script>
