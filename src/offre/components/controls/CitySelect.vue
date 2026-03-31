<script setup lang="ts">
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/shared/components/ui/select";
import type {OffreDepartureOption} from "offre/types";

interface Props {
	options: OffreDepartureOption[];
	disabled?: boolean;
	placeholder?: string;
}

const modelValue = defineModel<string>({required: true});

defineProps<Props>()
</script>

<template>
	<div class="offre-city-select flex-1">
		<Select v-model="modelValue" :disabled="disabled">
			<SelectTrigger
					class="offre-city-select__trigger w-full cursor-pointer rounded-lg border text-sm"
			>
				<SelectValue :placeholder="placeholder"/>
			</SelectTrigger>
			<SelectContent :body-lock="false" class="offre-city-select__content rounded-lg">
				<SelectItem
						v-for="option in options"
						:key="option.id"
						:value="option.id"
						:text-value="option.label"
						class="offre-city-select__item"
				>
					{{ option.label }}
				</SelectItem>
			</SelectContent>
		</Select>
	</div>
</template>

<style scoped lang="scss">
.offre-city-select {
	@media (min-width: 1024px) {
		width: 150px;
		flex: none;
	}

	@media (min-width: 1280px) {
		width: 180px;
		flex: none;
	}
}

.offre-city-select__content {
	padding: 8px;
}

.offre-city-select__trigger:hover {
	border-color: rgb(74 158 212);
	color: rgb(74 158 212);
}

.offre-city-select__item {
	border-radius: 8px;
	color: #262626;
	transition: background-color 0.15s ease, color 0.15s ease;
}

.offre-city-select__trigger {
	transition: border-color 0.15s ease, color 0.15s ease;
}

.offre-city-select__item[data-highlighted] {
	background-color: transparent;
	color: rgb(74 158 212);
}

.offre-city-select__item[data-state="checked"] {
	background-color: #e5f7ff;
	color: rgb(74 158 212);
}
</style>
