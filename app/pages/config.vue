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

          <!-- Portal Topics -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start size="small">mdi-lock</v-icon>
              Portal
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex flex-column ga-2">
                <v-text-field
                  v-model="settings.portalSubscribeTopic"
                  label="Subscribe (Status)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.portalPublishTopic"
                  label="Publish (Befehle)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- HA Topics -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start size="small">mdi-lightbulb</v-icon>
              HA
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex flex-column ga-2">

                <!-- Temperatur -->
                <div class="text-caption text-medium-emphasis">Temperatur</div>
                <v-text-field
                  v-model="settings.haTemperaturTopic"
                  label="Topic"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-row no-gutters class="ga-2">
                  <v-col>
                    <v-text-field
                      v-model="settings.haTemperaturFieldTemp"
                      label="Feld Temperatur"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haTemperaturFieldHumidity"
                      label="Feld Feuchtigkeit"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <!-- PV -->
                <div class="text-caption text-medium-emphasis mt-2">PV</div>
                <v-text-field
                  v-model="settings.haPvTopic"
                  label="Topic PV Daten"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-row no-gutters class="ga-2">
                  <v-col>
                    <v-text-field
                      v-model="settings.haPvFieldE1"
                      label="Feld E1"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haPvFieldE2"
                      label="Feld E2"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haPvFieldP1"
                      label="Feld P1"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haPvFieldP2"
                      label="Feld P2"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-text-field
                  v-model="settings.haPvShellyTopic"
                  label="Topic PV Shelly"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-row no-gutters class="ga-2">
                  <v-col>
                    <v-text-field
                      v-model="settings.haPvShellyFieldPower"
                      label="Feld Power"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haPvShellyFieldToday"
                      label="Feld Today"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <!-- Verbrauch -->
                <div class="text-caption text-medium-emphasis mt-2">Verbrauch</div>
                <v-text-field
                  v-model="settings.haEnergyTopic"
                  label="Topic 3EM"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-row no-gutters class="ga-2">
                  <v-col>
                    <v-text-field
                      v-model="settings.haEnergyFieldPower"
                      label="Feld Power"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haEnergyFieldImport"
                      label="Feld Import"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haEnergyFieldExport"
                      label="Feld Export"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <!-- Kommer -->
                <div class="text-caption text-medium-emphasis mt-2">Kommer</div>
                <v-text-field
                  v-model="settings.haKommerSensorTopic"
                  label="Topic Sensor"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-row no-gutters class="ga-2">
                  <v-col>
                    <v-text-field
                      v-model="settings.haKommerFieldTemp"
                      label="Feld Temperatur"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="settings.haKommerFieldHumidity"
                      label="Feld Feuchtigkeit"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-text-field
                  v-model="settings.haKommerStateTopic"
                  label="Topic Status (Subscribe)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haKommerStateField"
                  label="Feld Status"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haKommerCmndTopic"
                  label="Topic Schalten (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />

                <!-- Brenner -->
                <div class="text-caption text-medium-emphasis mt-2">Brenner</div>
                <v-text-field
                  v-model="settings.haBrennerTemp1Topic"
                  label="Topic Temp 1"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haBrennerTemp2Topic"
                  label="Topic Temp 2"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haBrennerFieldTemp"
                  label="Feld Temperatur (beide Topics)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haBrennerStateTopic"
                  label="Topic Status (Subscribe)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haBrennerStateField"
                  label="Feld Status"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.haBrennerCmndTopic"
                  label="Topic Schalten (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />

                <!-- Alarm -->
                <div class="text-caption text-medium-emphasis mt-2">Alarm</div>
                <v-text-field
                  v-model="settings.alarmStateSub"
                  label="State (Subscribe)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.alarmAlertSub"
                  label="Alert (Subscribe)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.alarmSetPub"
                  label="Set (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />

                <!-- Away Sim -->
                <div class="text-caption text-medium-emphasis mt-2">Away Sim</div>
                <v-text-field
                  v-model="settings.awaySimStatusSub"
                  label="Status (Subscribe)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.awaySimManualSetPub"
                  label="Manual Set (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.awaySimScheduleSetPub"
                  label="Schedule Set (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.awaySimScheduleStartSetPub"
                  label="Schedule Start Set (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.awaySimScheduleEndSetPub"
                  label="Schedule End Set (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />

              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- WOL Topics -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start size="small">mdi-lan</v-icon>
              WOL
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex flex-column ga-2">
                <v-text-field
                  v-model="settings.wolSubscribeTopic"
                  label="Hosts Status (Subscribe)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.wolWakeTopic"
                  label="Wake-on-LAN (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model="settings.wolShutdownTopic"
                  label="Shutdown (Publish)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
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
});

const onDarkModeToggle = () => {
  localStorage.setItem("darkMode", isDarkModeEnabled.value.toString());
  if (setDarkMode) setDarkMode(isDarkModeEnabled.value);
};

// MQTT Settings
const { loadSettings, saveSettings, defaultMqttSettings } = useMqttSettings();
const { configureMqtt, connectToBroker } = useSocketIO();

const settings = reactive(loadSettings());
const showPassword = ref(false);
const snackbarVisible = ref(false);
const snackbarMessage = ref("");

onMounted(() => {
  connectToBroker();
});

const showSnackbar = (msg: string) => {
  snackbarMessage.value = msg;
  snackbarVisible.value = true;
};

const saveMqttConnection = () => {
  saveSettings({ ...settings });
  configureMqtt(settings.mqttServer, settings.mqttUsername || undefined, settings.mqttPassword || undefined);
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
