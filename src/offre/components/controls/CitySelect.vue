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
					size="brand"
					class="offre-city-select__trigger w-full bg-brand-card"
			>
				<SelectValue :placeholder="placeholder" class="offre-city-select__value"/>
			</SelectTrigger>
			<SelectContent :body-lock="false" class="offre-city-select__content">
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
.offre-city-select__trigger {
	background-color: var(--brand-card);
	border-color: var(--brand-control-border);
	border-radius: 8px;
	font-size: var(--brand-text-control);
	height: 40px;
	line-height: var(--brand-leading-control);
	padding-left: 16px;
	padding-right: 16px;
	padding-top: 0;
	padding-bottom: 0;

	&:hover {
		background-color: var(--brand-card);
		border-color: var(--brand-primary);
		color: var(--brand-primary);
	}

	&[data-state="open"] {
		background-color: var(--brand-card);
	}
}

.offre-city-select__content {
  border-color: var(--brand-border);
  border-radius: 8px;
  box-shadow: var(--brand-shadow-popover);
  overflow: hidden;
}

.offre-city-select__item {
  border-radius: 8px;
  color: var(--brand-foreground);
  font-size: var(--brand-text-control);
  line-height: var(--brand-leading-control);
  min-height: 40px;
  padding: 8px 32px 8px 16px;

  &[data-highlighted] {
    background-color: var(--brand-primary);
		color: var(--brand-primary-foreground);
	}

  &[data-state="checked"] {
    background-color: color-mix(in srgb, var(--brand-primary) 12%, var(--brand-card));
    color: var(--brand-primary);
  }
}

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
</style>
