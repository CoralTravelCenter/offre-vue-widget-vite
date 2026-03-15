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
      class="switcher shrink-0 w-10 h-10 flex items-center justify-center border mr-2 rounded-lg"
      @click="toggleViewMode"
  >
    <MapPinned v-if="isListMode" class="size-4"/>
    <List v-else class="size-4"/>
  </Button>
</template>

<style scoped lang="scss">
.switcher {
  grid-area: switcher;
}
</style>