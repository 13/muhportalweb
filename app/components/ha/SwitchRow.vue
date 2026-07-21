<template>
  <v-list-item>
    <v-list-item-title
      class="d-flex justify-space-between align-center w-100"
    >
      <span>{{ title }}</span>

      <span class="d-flex align-center ga-2 pr-4">
        <span class="font-weight-bold">{{ primaryText }}</span>
        <span class="text-caption">{{ secondaryText }}</span>
      </span>
    </v-list-item-title>

    <template #append>
      <v-switch
        :model-value="modelValue"
        :disabled="disabled"
        color="green"
        hide-details
        density="compact"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  primaryText: string;
  secondaryText: string;
  modelValue: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean | null];
}>();
</script>
