<script setup lang="ts">
import {computed} from "vue";
import OffreControlSelect from "@/offre/components/OffreControlSelect/OffreControlSelect.vue";
import type {OffreControlOption} from "@/offre/types";

interface Props {
	options: OffreControlOption[];
	disabled?: boolean;
	placeholder?: string;
}

const modelValue = defineModel<string>({required: true});

const props = defineProps<Props>();

const normalizedOptions = computed(() => {
	return props.options.map((option) => ({
		value: option.value,
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
		root-class="offre-month-select"
		trigger-class="offre-month-select__trigger"
		value-class="offre-month-select__value"
		content-class="offre-month-select__content"
		item-class="offre-month-select__item"
	/>
</template>
