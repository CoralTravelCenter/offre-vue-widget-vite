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
        class="offre-tour-type-tabs__trigger offre-tour-type-tabs__trigger--package inline-flex items-center justify-center border bg-white font-normal text-foreground transition-colors hover:text-primary data-[state=active]:z-10 data-[state=active]:border-primary data-[state=active]:text-primary"
      >
        Пакетный тур
      </TabsTrigger>

      <TabsTrigger
        value="hotel"
        :class="[
          'offre-tour-type-tabs__trigger offre-tour-type-tabs__trigger--hotel inline-flex items-center justify-center border bg-white font-normal text-foreground transition-colors hover:text-primary data-[state=active]:z-10 data-[state=active]:border-primary data-[state=active]:text-primary',
          props.isHotelOnly ? 'offre-tour-type-tabs__trigger--single col-span-2' : '-ml-px'
        ]"
      >
        Только отель
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>

<style scoped lang="scss">
.offre-tour-type-tabs__trigger {
  border-color: var(--offre-color-control-border);
  padding: var(--offre-control-padding-y) var(--offre-control-padding-x);
  font-size: var(--offre-text-control);
  line-height: var(--offre-leading-control);
}

.offre-tour-type-tabs__trigger--package {
  border-radius: var(--offre-radius-segment) 0 0 var(--offre-radius-segment);
}

.offre-tour-type-tabs__trigger--hotel {
  border-radius: 0 var(--offre-radius-segment) var(--offre-radius-segment) 0;
}

.offre-tour-type-tabs__trigger--single {
  border-radius: var(--offre-radius-segment);
}
</style>
