<script setup lang="ts">
import CitySelect from "offre/components/controls/CitySelect.vue";
import MonthSelect from "offre/components/controls/MonthSelect.vue";
import type {OffreControlOption, OffreDepartureOption} from "offre/types";
import {computed} from "vue";

interface Props {
  departures: OffreDepartureOption[];
  timeframeOptions: OffreControlOption[];
  departuresLoading?: boolean;
  timeframesLoading?: boolean;
}

const selectedDepartureId = defineModel<string>("selectedDepartureId", {required: true});
const selectedTimeframe = defineModel<string>("selectedTimeframe", {required: true});

const props = withDefaults(defineProps<Props>(), {
  departuresLoading: false,
  timeframesLoading: false
});

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
  </div>
</template>

<style scoped lang="scss">
.offre-controls__layout {
  grid-area: inputs;
}
</style>
