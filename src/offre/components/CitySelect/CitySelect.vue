<script setup lang="ts">
import {computed} from "vue";
import OffreControlSelect from "@/offre/components/OffreControlSelect/OffreControlSelect.vue";
import type {OffreDepartureOption} from "@/offre/types";

interface Props {
	options: OffreDepartureOption[];
	disabled?: boolean;
	placeholder?: string;
}

const modelValue = defineModel<string>({required: true});

const props = defineProps<Props>();

const normalizedOptions = computed(() => {
	return props.options.map((option) => ({
		value: option.id,
		label: option.label
	}));
});
</script>

<template>
	<OffreControlSelect
		v-model="modelValue"
		:disabled="disabled"
		:options="normalizedOptions"
		:placeholder="placeholder"
		root-class="offre-city-select"
		trigger-class="offre-city-select__trigger"
		value-class="offre-city-select__value"
		content-class="offre-city-select__content"
		item-class="offre-city-select__item"
	/>
</template>
