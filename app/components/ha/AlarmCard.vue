<template>
  <!-- Alarm -->
  <v-list-item>
    <v-list-item-title>Alarm</v-list-item-title>
    <template #append>
      <v-switch
        :model-value="armed"
        :disabled="disabled"
        color="green"
        hide-details
        density="compact"
        @update:model-value="emit('toggle-alarm', $event)"
      />
    </template>
  </v-list-item>

  <!-- Alarm @Home -->
  <v-list-item>
    <v-list-item-title>Alarm @Home</v-list-item-title>
    <template #append>
      <v-switch
        :model-value="atHome"
        :disabled="disabled"
        color="green"
        hide-details
        density="compact"
        @update:model-value="emit('toggle-at-home', $event)"
      />
    </template>
  </v-list-item>

  <!-- Alarm alerts -->
  <template v-if="alerts.length > 0">
    <v-divider />
    <v-list-item
      v-for="alert in alerts.slice(0, 10)"
      :key="alert.ts"
      density="compact"
    >
      <v-list-item-title
        class="d-flex justify-space-between align-center w-100"
      >
        <span>{{ alert.label || alert.device }}</span>
        <span class="text-caption">{{ alert.time }}</span>
      </v-list-item-title>
    </v-list-item>
  </template>
</template>

<script setup lang="ts">
import type { AlarmAlert } from "#shared/types/ha";

defineProps<{
  armed: boolean;
  atHome: boolean;
  disabled?: boolean;
  alerts: AlarmAlert[];
}>();

const emit = defineEmits<{
  "toggle-alarm": [value: boolean | null];
  "toggle-at-home": [value: boolean | null];
}>();
</script>
