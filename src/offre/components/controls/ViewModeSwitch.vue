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
      :class="[
        'offre-view-mode-switch mr-2 size-10 shrink-0 rounded-[var(--brand-radius-button)] border border-brand-control-border bg-brand-card text-brand-foreground transition-[border-color,color,background-color] hover:border-brand-primary hover:bg-brand-card hover:text-brand-primary',
        isListMode ? 'offre-view-mode-switch--list' : 'offre-view-mode-switch--map'
      ]"
      @click="toggleViewMode"
  >
    <MapPinned v-if="isListMode" class="offre-view-mode-switch__icon size-4"/>
    <List v-else class="offre-view-mode-switch__icon size-4"/>
  </Button>
</template>
