<script setup lang="ts">
import { computed } from "vue";
import type { OffreTourType } from "@/offre/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const modelValue = defineModel<OffreTourType>({ required: true });

const props = withDefaults(defineProps<{
  isHotelOnly?: boolean;
  disabled?: boolean;
  size?: "default" | "compact";
}>(), {
  isHotelOnly: false,
  disabled: false,
  size: "default"
});

const selectedValue = computed({
  get() {
    return props.isHotelOnly ? "hotel" : modelValue.value;
  },
  set(value) {
    if (!value || props.disabled) {
      return;
    }

    modelValue.value = value === "hotel" ? "hotel" : "package";
  }
});

const isCompact = computed(() => props.size === "compact");

function getRootClass() {
  return [
    "offre-tour-type-tabs",
    isCompact.value ? "offre-tour-type-tabs--compact" : "offre-tour-type-tabs--default"
  ];
}

function getTriggerSizeClass() {
  return isCompact.value
    ? "offre-tour-type-tabs__trigger--compact"
    : "offre-tour-type-tabs__trigger--default";
}

function getPackageTriggerClass() {
  return [
    "offre-tour-type-tabs__trigger",
    "offre-tour-type-tabs__trigger--package",
    getTriggerSizeClass()
  ];
}

function getHotelTriggerClass() {
  return [
    "offre-tour-type-tabs__trigger",
    "offre-tour-type-tabs__trigger--hotel",
    props.isHotelOnly
      ? "offre-tour-type-tabs__trigger--single"
      : "offre-tour-type-tabs__trigger--paired",
    getTriggerSizeClass()
  ];
}
</script>

<template>
  <Tabs
    v-model="selectedValue"
    :class="getRootClass()"
  >
    <TabsList class="offre-tour-type-tabs__list">
      <TabsTrigger
        v-if="!isHotelOnly"
        value="package"
        size="brand"
        :class="getPackageTriggerClass()"
      >
        Пакетный тур
      </TabsTrigger>

      <TabsTrigger
        value="hotel"
        :class="getHotelTriggerClass()"
        size="brand"
      >
        Только отель
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>

<style scoped src="./OffreTourTypeTabs.scss" lang="scss"></style>
