<script setup lang="ts">
import { computed } from "vue";
import type { OffreTourType } from "offre/types";
import { Tabs, TabsList, TabsTrigger } from "ui/tabs";

const modelValue = defineModel<OffreTourType>({ required: true });

const props = withDefaults(defineProps<{
  isHotelOnly?: boolean;
  disabled?: boolean;
}>(), {
  isHotelOnly: false,
  disabled: false
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
</script>

<template>
  <Tabs
    v-model="selectedValue"
    class="w-full"
  >
    <TabsList class="grid w-full grid-cols-2 gap-2 rounded-lg">
      <TabsTrigger
        v-if="!isHotelOnly"
        value="package"
        class="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-none transition-colors hover:border-primary/45 hover:bg-primary/5 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        Пакетный тур
      </TabsTrigger>

      <TabsTrigger
        value="hotel"
        :class="[
          'inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-none transition-colors hover:border-primary/45 hover:bg-primary/5 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
          props.isHotelOnly ? 'col-span-2' : ''
        ]"
      >
        Только отель
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
