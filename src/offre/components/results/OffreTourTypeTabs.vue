<script setup lang="ts">
import { computed } from "vue";
import type { OffreTourType } from "offre/types";
import { Tabs, TabsList, TabsTrigger } from "ui/tabs";

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
    "offre-tour-type-tabs w-full",
    isCompact.value ? "offre-tour-type-tabs--compact" : "offre-tour-type-tabs--default"
  ];
}

function getTriggerSizeClass() {
  return isCompact.value
    ? "offre-tour-type-tabs__trigger--compact h-[var(--brand-control-height-compact)] px-[var(--brand-control-padding-x-compact)] py-[var(--brand-control-padding-y-compact)] text-[length:var(--brand-text-control-compact)] leading-[var(--brand-leading-control-compact)]"
    : "offre-tour-type-tabs__trigger--default";
}

function getPackageTriggerClass() {
  return [
    "offre-tour-type-tabs__trigger offre-tour-type-tabs__trigger--package inline-flex min-w-0 items-center justify-center whitespace-normal text-center rounded-l-[var(--brand-radius-segment)] rounded-r-none border border-brand-control-border bg-transparent px-[var(--brand-control-padding-x)] py-[var(--brand-control-padding-y)] text-[length:var(--brand-text-control)] font-normal leading-[var(--brand-leading-control)] text-brand-foreground transition-[border-color,color,background-color] hover:border-brand-primary hover:text-brand-primary data-[state=active]:z-10 data-[state=active]:border-brand-primary data-[state=active]:bg-brand-primary data-[state=active]:text-brand-primary-foreground",
    getTriggerSizeClass()
  ];
}

function getHotelTriggerClass() {
  return [
    "offre-tour-type-tabs__trigger offre-tour-type-tabs__trigger--hotel inline-flex min-w-0 items-center justify-center whitespace-normal text-center border border-brand-control-border bg-transparent px-[var(--brand-control-padding-x)] py-[var(--brand-control-padding-y)] text-[length:var(--brand-text-control)] font-normal leading-[var(--brand-leading-control)] text-brand-foreground transition-[border-color,color,background-color] hover:border-brand-primary hover:text-brand-primary data-[state=active]:z-10 data-[state=active]:border-brand-primary data-[state=active]:bg-brand-primary data-[state=active]:text-brand-primary-foreground",
    props.isHotelOnly
      ? "offre-tour-type-tabs__trigger--single col-span-2 rounded-[var(--brand-radius-segment)]"
      : "offre-tour-type-tabs__trigger--paired -ml-px rounded-l-none rounded-r-[var(--brand-radius-segment)]",
    getTriggerSizeClass()
  ];
}
</script>

<template>
  <Tabs
    v-model="selectedValue"
    :class="getRootClass()"
  >
    <TabsList class="offre-tour-type-tabs__list grid w-full grid-cols-2 bg-transparent p-0">
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
