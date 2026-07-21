<template>
  <v-app-bar :elevation="1">
    <template #prepend>
      <v-app-bar-nav-icon>
        <v-icon color="primary">mdi-cog</v-icon>
      </v-app-bar-nav-icon>
    </template>

    <v-app-bar-title class="text-h5">Einstellungen</v-app-bar-title>

    <template #append>
      <v-btn icon variant="text" to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </template>
  </v-app-bar>

  <v-container fluid class="d-flex justify-center pa-0 pa-md-6">
    <div class="d-flex flex-column ga-4 w-100" style="max-width: 800px">

      <!-- Appearance -->
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

      <!-- MQTT Connection -->
      <v-card class="ma-0">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-0">
          <v-icon start>mdi-server-network</v-icon>
          MQTT Verbindung
        </v-card-title>
        <v-card-text class="d-flex flex-column ga-2 pt-3">
          <v-alert
            v-if="authFailed"
            type="error"
            density="compact"
            text="Authentifizierung fehlgeschlagen – Auth Token prüfen"
          />
          <v-text-field
            v-model="settings.mqttServer"
            label="Server URL"
            placeholder="mqtt://192.168.1.1:1883"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-text-field
            v-model="settings.mqttUsername"
            label="Benutzername"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-text-field
            v-model="settings.mqttPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Passwort"
            density="compact"
            variant="outlined"
            hide-details
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
          />
          <v-text-field
            v-model="authTokenLocal"
            :type="showAuthToken ? 'text' : 'password'"
            label="Auth Token (Server-Zugriff)"
            hint="Nur nötig wenn AUTH_TOKEN auf dem Server gesetzt ist"
            persistent-hint
            density="compact"
            variant="outlined"
            :append-inner-icon="showAuthToken ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showAuthToken = !showAuthToken"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="saveMqttConnection">
            <v-icon start>mdi-content-save</v-icon>
            Speichern & Verbinden
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- MQTT Topics -->
      <v-card class="ma-0">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-0">
          <v-icon start>mdi-tag-multiple</v-icon>
          MQTT Topics
        </v-card-title>
        <v-expansion-panels variant="accordion" flat class="mt-2">

          <v-expansion-panel v-for="panel in topicPanels" :key="panel.title">
            <v-expansion-panel-title>
              <v-icon start size="small">{{ panel.icon }}</v-icon>
              {{ panel.title }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex flex-column ga-2">
                <template v-for="(group, gi) in panel.groups" :key="gi">
                  <div
                    v-if="group.caption"
                    class="text-caption text-medium-emphasis"
                    :class="{ 'mt-2': gi > 0 }"
                  >
                    {{ group.caption }}
                  </div>
                  <template v-for="(row, ri) in group.rows" :key="ri">
                    <v-row v-if="Array.isArray(row)" no-gutters class="ga-2">
                      <v-col v-for="field in row" :key="field.key">
                        <v-text-field
                          v-model="settings[field.key]"
                          :label="field.label"
                          density="compact"
                          variant="outlined"
                          hide-details
                        />
                      </v-col>
                    </v-row>
                    <v-text-field
                      v-else
                      v-model="settings[row.key]"
                      :label="row.label"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </template>
                </template>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>

        <v-card-actions class="pa-4">
          <v-btn variant="text" color="secondary" @click="resetTopics">
            Zurücksetzen
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="saveTopics">
            <v-icon start>mdi-content-save</v-icon>
            Speichern
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- About -->
      <v-card class="ma-0 text-center">
        <v-card-text>
          <div class="d-flex flex-column align-center ga-4">
            <v-avatar size="88" rounded="lg" class="bg-white elevation-2">
              <v-img src="/muhportal.svg" alt="muhportalweb logo" />
            </v-avatar>
            <div class="text-h5 font-weight-bold">muhportalweb</div>
            <div class="text-body-1 text-medium-emphasis">
              MUH Portal Web is a lightweight home automation frontend for
              portal access, wake-on-lan and Home Assistant controls.
            </div>
          </div>
        </v-card-text>
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

  <!-- Save confirmation snackbar -->
  <v-snackbar v-model="snackbarVisible" :timeout="2000" color="green" location="top">
    {{ snackbarMessage }}
  </v-snackbar>
</template>

<script setup lang="ts">
import pkg from "../../package.json";
import { getAuthToken, setAuthToken } from "../composables/useSocketIO";
import type { MqttSettings } from "../composables/useMqttSettings";

const appVersion = pkg.version;
const buildDate = useRuntimeConfig().public.buildDate as string;
const formatBuildDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const formattedBuildDate = formatBuildDate(buildDate);

const isDarkModeEnabled = ref(false);
const setDarkMode = inject<(enableDarkMode: boolean) => void>("setDarkMode");

onMounted(() => {
  isDarkModeEnabled.value = localStorage.getItem("darkMode") === "true";
  authTokenLocal.value = getAuthToken();
});

const onDarkModeToggle = () => {
  localStorage.setItem("darkMode", isDarkModeEnabled.value.toString());
  if (setDarkMode) setDarkMode(isDarkModeEnabled.value);
};

// MQTT Settings
const { loadSettings, saveSettings, defaultMqttSettings } = useMqttSettings();
const { configureMqtt, connectToBroker, reconnectToBroker, authFailed } = useSocketIO();

const settings = reactive(loadSettings());
const showPassword = ref(false);
const showAuthToken = ref(false);
const authTokenLocal = ref("");
const snackbarVisible = ref(false);
const snackbarMessage = ref("");

// Declarative form definition - add a topic here and in MqttSettings, done
interface TopicField {
  key: keyof MqttSettings;
  label: string;
}
type TopicRow = TopicField | TopicField[];
interface TopicPanel {
  title: string;
  icon: string;
  groups: { caption?: string; rows: TopicRow[] }[];
}

const topicPanels: TopicPanel[] = [
  {
    title: "Portal",
    icon: "mdi-lock",
    groups: [
      {
        rows: [
          { key: "portalSubscribeTopic", label: "Subscribe (Status)" },
          { key: "portalPublishTopic", label: "Publish (Befehle)" },
        ],
      },
    ],
  },
  {
    title: "HA",
    icon: "mdi-lightbulb",
    groups: [
      {
        caption: "Temperatur",
        rows: [
          { key: "haTemperaturTopic", label: "Topic" },
          [
            { key: "haTemperaturFieldTemp", label: "Feld Temperatur" },
            { key: "haTemperaturFieldHumidity", label: "Feld Feuchtigkeit" },
          ],
        ],
      },
      {
        caption: "PV",
        rows: [
          { key: "haPvTopic", label: "Topic PV Daten" },
          [
            { key: "haPvFieldE1", label: "Feld E1" },
            { key: "haPvFieldE2", label: "Feld E2" },
            { key: "haPvFieldP1", label: "Feld P1" },
            { key: "haPvFieldP2", label: "Feld P2" },
          ],
          { key: "haPvShellyTopic", label: "Topic PV Shelly" },
          [
            { key: "haPvShellyFieldPower", label: "Feld Power" },
            { key: "haPvShellyFieldToday", label: "Feld Today" },
          ],
        ],
      },
      {
        caption: "Verbrauch",
        rows: [
          { key: "haEnergyTopic", label: "Topic 3EM" },
          [
            { key: "haEnergyFieldPower", label: "Feld Power" },
            { key: "haEnergyFieldImport", label: "Feld Import" },
            { key: "haEnergyFieldExport", label: "Feld Export" },
          ],
        ],
      },
      {
        caption: "Kommer",
        rows: [
          { key: "haKommerSensorTopic", label: "Topic Sensor" },
          [
            { key: "haKommerFieldTemp", label: "Feld Temperatur" },
            { key: "haKommerFieldHumidity", label: "Feld Feuchtigkeit" },
          ],
          { key: "haKommerStateTopic", label: "Topic Status (Subscribe)" },
          { key: "haKommerStateField", label: "Feld Status" },
          { key: "haKommerCmndTopic", label: "Topic Schalten (Publish)" },
        ],
      },
      {
        caption: "Brenner",
        rows: [
          { key: "haBrennerTemp1Topic", label: "Topic Temp 1" },
          { key: "haBrennerTemp2Topic", label: "Topic Temp 2" },
          { key: "haBrennerFieldTemp", label: "Feld Temperatur (beide Topics)" },
          { key: "haBrennerStateTopic", label: "Topic Status (Subscribe)" },
          { key: "haBrennerStateField", label: "Feld Status" },
          { key: "haBrennerCmndTopic", label: "Topic Schalten (Publish)" },
        ],
      },
      {
        caption: "Alarm",
        rows: [
          { key: "alarmStateSub", label: "State (Subscribe)" },
          { key: "alarmAlertSub", label: "Alert (Subscribe)" },
          { key: "alarmSetPub", label: "Set (Publish)" },
        ],
      },
      {
        caption: "Away Sim",
        rows: [
          { key: "awaySimStatusSub", label: "Status (Subscribe)" },
          { key: "awaySimManualSetPub", label: "Manual Set (Publish)" },
          { key: "awaySimScheduleSetPub", label: "Schedule Set (Publish)" },
          { key: "awaySimScheduleStartSetPub", label: "Schedule Start Set (Publish)" },
          { key: "awaySimScheduleEndSetPub", label: "Schedule End Set (Publish)" },
        ],
      },
    ],
  },
  {
    title: "WOL",
    icon: "mdi-lan",
    groups: [
      {
        rows: [
          { key: "wolSubscribeTopic", label: "Hosts Status (Subscribe)" },
          { key: "wolWakeTopic", label: "Wake-on-LAN (Publish)" },
          { key: "wolShutdownTopic", label: "Shutdown (Publish)" },
        ],
      },
    ],
  },
];

onMounted(() => {
  connectToBroker();
});

const showSnackbar = (msg: string) => {
  snackbarMessage.value = msg;
  snackbarVisible.value = true;
};

const saveMqttConnection = () => {
  saveSettings({ ...settings });
  const tokenChanged = authTokenLocal.value !== getAuthToken();
  setAuthToken(authTokenLocal.value);
  configureMqtt(settings.mqttServer, settings.mqttUsername || undefined, settings.mqttPassword || undefined);
  if (tokenChanged || authFailed.value) {
    // New token only applies on a fresh Socket.IO handshake
    reconnectToBroker();
  }
  showSnackbar("MQTT Verbindung gespeichert");
};

const saveTopics = () => {
  saveSettings({ ...settings });
  showSnackbar("Topics gespeichert");
};

const resetTopics = () => {
  const defaults = { ...defaultMqttSettings };
  Object.assign(settings, defaults);
  saveSettings({ ...settings });
  showSnackbar("Topics zurückgesetzt");
};
</script>
