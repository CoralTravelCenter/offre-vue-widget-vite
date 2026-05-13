<script setup lang="ts">
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {HTMLAttributes} from "vue";

interface OffreControlSelectOption {
	value: string;
	label: string;
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
				<SelectValue :placeholder="props.placeholder" :class="['offre-control-select__value', props.valueClass]"/>
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
