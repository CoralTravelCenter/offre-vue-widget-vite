<script setup lang="ts">
import CitySelect from "offre/components/controls/CitySelect.vue";
import MonthSelect from "offre/components/controls/MonthSelect.vue";
import OffreOfferGuestsControl from "offre/components/results/OffreOfferGuestsControl.vue";
import type {OffreControlOption, OffreDepartureOption} from "offre/types";
import {computed} from "vue";

interface Props {
  departures: OffreDepartureOption[];
  timeframeOptions: OffreControlOption[];
  adultsCount?: number;
  childrenAges?: number[];
  departuresLoading?: boolean;
  timeframesLoading?: boolean;
}

const selectedDepartureId = defineModel<string>("selectedDepartureId", {required: true});
const selectedTimeframe = defineModel<string>("selectedTimeframe", {required: true});

const props = withDefaults(defineProps<Props>(), {
  adultsCount: 2,
  childrenAges: () => [],
  departuresLoading: false,
  timeframesLoading: false
});
const emit = defineEmits<{
  "apply-guests": [value: { adultsCount: number; childrenAges: number[] }];
  "reset-guests": [];
}>();

const isDepartureDisabled = computed(() => {
  return props.departuresLoading || props.departures.length === 0;
});

const isTimeframeDisabled = computed(() => {
  return props.timeframesLoading || props.timeframeOptions.length === 0;
});
</script>

<template>
  <div class="offre-controls offre-controls__layout flex gap-2 pl-2">
    <CitySelect
        v-model="selectedDepartureId"
        :disabled="isDepartureDisabled"
        :options="departures"
    />
    <MonthSelect
        v-model="selectedTimeframe"
        :disabled="isTimeframeDisabled"
        :options="timeframeOptions"
    />
    <OffreOfferGuestsControl
        :adults-count="adultsCount"
        :children-ages="childrenAges"
        class="offre-controls__guests"
        @apply="emit('apply-guests', $event)"
        @reset="emit('reset-guests')"
    />
  </div>
</template>

<style scoped lang="scss">
.offre-controls__layout {
  grid-area: inputs;
}

.offre-controls__guests {
  flex: none;
}
</style>
