<script setup lang="ts">
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {HTMLAttributes} from "vue";
import {computed} from "vue";

interface OffreControlSelectOption {
	value: string;
	label: string;
	triggerLabel?: string;
}

interface Props {
	options: OffreControlSelectOption[];
	disabled?: boolean;
	placeholder?: string;
	rootClass?: HTMLAttributes["class"];
	triggerClass?: HTMLAttributes["class"];
	valueClass?: HTMLAttributes["class"];
	contentClass?: HTMLAttributes["class"];
	itemClass?: HTMLAttributes["class"];
}

const modelValue = defineModel<string>({required: true});

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	placeholder: "",
	rootClass: "",
	triggerClass: "",
	valueClass: "",
	contentClass: "",
	itemClass: ""
});

const selectedOption = computed(() => {
	const normalizedModelValue = String(modelValue.value ?? "");

	return props.options.find((option) => String(option.value) === normalizedModelValue) ?? null;
});

const triggerLabel = computed(() => {
	const explicitLabel = selectedOption.value?.triggerLabel
		?? selectedOption.value?.label
		?? String(modelValue.value ?? "").trim();

	return explicitLabel || props.placeholder;
});

function getRootClass(disabled: boolean, rootClass: HTMLAttributes["class"]) {
	return [
		"offre-control-select",
		disabled ? "offre-control-select--disabled" : "offre-control-select--enabled",
		rootClass
	];
}
</script>

<template>
	<div :class="getRootClass(props.disabled, props.rootClass)">
		<Select v-model="modelValue" :disabled="props.disabled">
			<SelectTrigger
					size="brand"
					:class="[
						'offre-control-select__trigger',
						props.triggerClass
					]"
			>
				<span :class="['offre-control-select__value', props.valueClass]">
					{{ triggerLabel }}
				</span>
				<SelectValue
					:placeholder="props.placeholder"
					class="offre-control-select__value-sr-only"
					aria-hidden="true"
				/>
			</SelectTrigger>

			<SelectContent
					:body-lock="false"
					:class="[
						'offre-control-select__content',
						props.contentClass
					]"
			>
				<SelectItem
						v-for="option in props.options"
						:key="option.value"
						:value="option.value"
						:text-value="option.label"
						:class="[
							'offre-control-select__item',
							props.itemClass
						]"
				>
					{{ option.label }}
				</SelectItem>
			</SelectContent>
		</Select>
	</div>
</template>

<style scoped src="./OffreControlSelect.scss" lang="scss"></style>
