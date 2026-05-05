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
</script>

<template>
  <Tabs
    v-model="selectedValue"
    :class="[
      'offre-tour-type-tabs w-full',
      props.size === 'compact' ? 'offre-tour-type-tabs--compact' : ''
    ]"
  >
    <TabsList class="offre-tour-type-tabs__list grid w-full grid-cols-2 bg-brand-card p-0">
      <TabsTrigger
        v-if="!isHotelOnly"
        value="package"
        size="brand"
        class="offre-tour-type-tabs__trigger offre-tour-type-tabs__trigger--package inline-flex items-center justify-center border bg-brand-card font-normal text-brand-foreground data-[state=active]:z-10 data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary"
      >
        Пакетный тур
      </TabsTrigger>

      <TabsTrigger
        value="hotel"
        :class="[
          'offre-tour-type-tabs__trigger offre-tour-type-tabs__trigger--hotel inline-flex items-center justify-center border bg-brand-card font-normal text-brand-foreground data-[state=active]:z-10 data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary',
          props.isHotelOnly ? 'offre-tour-type-tabs__trigger--single col-span-2' : '-ml-px'
        ]"
        size="brand"
      >
        Только отель
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>

<style scoped lang="scss">
.offre-tour-type-tabs__trigger {
  background-color: transparent;
  border-color: var(--brand-control-border);
  cursor: pointer;
  padding: var(--brand-control-padding-y) var(--brand-control-padding-x);
  font-size: var(--brand-text-control);
  line-height: var(--brand-leading-control);
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;

  &:not([data-state="active"]):hover {
    background-color: transparent;
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  &[data-state="active"] {
    background-color: var(--brand-primary);
    border-color: var(--brand-primary);
    color: var(--brand-primary-foreground);
  }
}

.offre-tour-type-tabs__trigger--package {
  border-radius: var(--brand-radius-segment) 0 0 var(--brand-radius-segment);
}

.offre-tour-type-tabs__trigger--hotel {
  border-radius: 0 var(--brand-radius-segment) var(--brand-radius-segment) 0;
}

.offre-tour-type-tabs__trigger--single {
  border-radius: var(--brand-radius-segment);
}

.offre-tour-type-tabs--compact .offre-tour-type-tabs__trigger {
  font-size: 11px;
  height: 28px;
  line-height: 16px;
  padding: 6px 8px;
}
</style>
