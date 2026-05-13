<script setup lang="ts">
import CitySelect from "@/offre/components/CitySelect/CitySelect.vue";
import MonthSelect from "@/offre/components/MonthSelect/MonthSelect.vue";
import OffreOfferGuestsControl from "@/offre/components/results/OffreOfferGuestsControl/OffreOfferGuestsControl.vue";
import type {OffreControlOption, OffreDepartureOption} from "@/offre/types";
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
	<div class="offre-controls controls">
		<CitySelect
			v-model="selectedDepartureId"
			:disabled="isDepartureDisabled"
			class="offre-controls__control offre-controls__control--departure offre-controls__departure"
			:options="departures"
		/>
		<MonthSelect
			v-model="selectedTimeframe"
			:disabled="isTimeframeDisabled"
			class="offre-controls__control offre-controls__control--timeframe offre-controls__timeframe"
			:options="timeframeOptions"
		/>
		<OffreOfferGuestsControl
			:adults-count="adultsCount"
			:children-ages="childrenAges"
			class="offre-controls__control offre-controls__control--guests offre-controls__guests"
			@apply="emit('apply-guests', $event)"
			@reset="emit('reset-guests')"
		/>
	</div>
</template>

<style scoped src="./OffreControls.scss" lang="scss"></style>
