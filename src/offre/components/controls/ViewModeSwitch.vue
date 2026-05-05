<script setup lang="ts">
import {Button} from "ui/button";
import {List, MapPinned} from "lucide-vue-next";
import {computed} from "vue";
import type {OffreViewMode} from "offre/types";

const modelValue = defineModel<OffreViewMode>({required: true});

const isListMode = computed(() => modelValue.value === "list");

function toggleViewMode() {
  modelValue.value = modelValue.value === "list" ? "map" : "list";
}
</script>

<template>
  <Button
      type="button"
      variant="outline"
      size="brand"
      :aria-label="isListMode ? 'Переключить на карту' : 'Переключить на список'"
      class="offre-view-mode-switch mr-2 size-10 shrink-0 border"
      @click="toggleViewMode"
  >
    <MapPinned v-if="isListMode" class="offre-view-mode-switch__icon size-4"/>
    <List v-else class="offre-view-mode-switch__icon size-4"/>
  </Button>
</template>

<style scoped lang="scss">
.offre-view-mode-switch {
  background-color: transparent;
  border-color: var(--brand-control-border);
  border-radius: var(--brand-radius-button);
  grid-area: switcher;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;

  &:hover {
    background-color: transparent;
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }
}
</style>
