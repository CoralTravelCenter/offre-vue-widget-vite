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
    class="offre-tour-type-tabs w-full"
  >
    <TabsList class="offre-tour-type-tabs__list grid w-full grid-cols-2 bg-white p-0">
      <TabsTrigger
        v-if="!isHotelOnly"
        value="package"
        class="offre-tour-type-tabs__trigger inline-flex items-center justify-center rounded-l-[6px] rounded-r-none border border-[#D9D9D9] bg-white px-[18px] py-[5px] text-[14px] font-normal leading-[22px] text-foreground transition-colors hover:text-primary data-[state=active]:z-10 data-[state=active]:border-primary data-[state=active]:text-primary"
      >
        Пакетный тур
      </TabsTrigger>

      <TabsTrigger
        value="hotel"
        :class="[
          'offre-tour-type-tabs__trigger inline-flex items-center justify-center rounded-r-[6px] rounded-l-none border border-[#D9D9D9] bg-white px-[18px] py-[5px] text-[14px] font-normal leading-[22px] text-foreground transition-colors hover:text-primary data-[state=active]:z-10 data-[state=active]:border-primary data-[state=active]:text-primary',
          props.isHotelOnly ? 'col-span-2 rounded-[6px]' : '-ml-px'
        ]"
      >
        Только отель
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
