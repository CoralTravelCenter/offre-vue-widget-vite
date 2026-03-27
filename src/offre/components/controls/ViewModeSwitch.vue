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
      size="icon"
      :aria-label="isListMode ? 'Переключить на карту' : 'Переключить на список'"
      class="offre-view-mode-switch switcher mr-2 size-10 shrink-0 rounded-lg border"
      @click="toggleViewMode"
  >
    <MapPinned v-if="isListMode" class="offre-view-mode-switch__icon size-4"/>
    <List v-else class="offre-view-mode-switch__icon size-4"/>
  </Button>
</template>

<style scoped lang="scss">
.switcher {
  grid-area: switcher;
}
</style>
