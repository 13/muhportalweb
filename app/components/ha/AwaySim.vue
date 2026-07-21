<template>
  <!-- Away Sim -->
  <v-list-item>
    <v-list-item-title>Away Sim</v-list-item-title>
    <template #append>
      <v-switch
        :model-value="manualActive"
        :disabled="disabled"
        color="green"
        hide-details
        density="compact"
        @update:model-value="emit('toggle-manual', $event)"
      />
    </template>
  </v-list-item>

  <!-- Away Schedule -->
  <v-list-item>
    <v-list-item-title
      class="d-flex justify-space-between align-center w-100"
    >
      <span>Away Schedule</span>
      <span class="d-flex align-center ga-1 pr-4">
        <v-text-field
          v-model="scheduleStart"
          type="time"
          density="compact"
          variant="underlined"
          hide-details
          class="time-input"
          style="width: 70px"
          :disabled="disabled"
          @change="emit('publish-start')"
        />
        <span class="text-caption px-1">–</span>
        <v-text-field
          v-model="scheduleEnd"
          type="time"
          density="compact"
          variant="underlined"
          hide-details
          class="time-input"
          style="width: 70px"
          :disabled="disabled"
          @change="emit('publish-end')"
        />
      </span>
    </v-list-item-title>
    <template #append>
      <v-switch
        :model-value="scheduleEnabled"
        :disabled="disabled"
        color="green"
        hide-details
        density="compact"
        @update:model-value="emit('toggle-schedule', $event)"
      />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
defineProps<{
  manualActive: boolean;
  scheduleEnabled: boolean;
  disabled?: boolean;
}>();

const scheduleStart = defineModel<string>("scheduleStart", { required: true });
const scheduleEnd = defineModel<string>("scheduleEnd", { required: true });

const emit = defineEmits<{
  "toggle-manual": [value: boolean | null];
  "toggle-schedule": [value: boolean | null];
  "publish-start": [];
  "publish-end": [];
}>();
</script>

<style scoped>
.time-input :deep(.v-field__input) {
  font-size: 0.75rem;
  min-height: unset;
  padding-top: 0;
  padding-bottom: 2px;
}
</style>
