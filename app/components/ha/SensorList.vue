<template>
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

  <!-- Verbrauch -->
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
          {{ formatEnergyKwh(pvConsumption) }}
        </span>
      </span>
    </v-list-item-title>
  </v-list-item>
</template>

<script setup lang="ts">
defineProps<{
  temperatur: { temp: number | null; humidity: number | null };
  pv: { e1: number | null; e2: number | null; p1: number | null; p2: number | null };
  pvShelly: { power: number | null; today: number | null };
  energy: { power: number | null; sumImport: number | null; sumExport: number | null };
  pvConsumption: number | null;
}>();
</script>
