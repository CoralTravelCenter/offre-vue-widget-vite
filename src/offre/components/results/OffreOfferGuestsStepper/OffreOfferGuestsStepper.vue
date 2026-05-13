<script setup lang="ts">
import {MinusIcon, PlusIcon} from "lucide-vue-next";
import {Button} from "@/components/ui/button";

interface Props {
	label: string;
	modelValue: number;
	decrementDisabled?: boolean;
	incrementDisabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	decrementDisabled: false,
	incrementDisabled: false
});

const emit = defineEmits<{
	"update:modelValue": [value: number];
}>();

function decrement() {
	emit("update:modelValue", -1);
}

function increment() {
	emit("update:modelValue", 1);
}
</script>

<template>
	<div class="offre-offer-guests-stepper">
		<span class="offre-offer-guests-stepper__label">
			{{ label }}
		</span>

		<div class="offre-offer-guests-stepper__controls">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				:disabled="decrementDisabled"
				class="offre-offer-guests-stepper__button"
				@click="decrement"
			>
				<MinusIcon class="offre-offer-guests-stepper__icon"/>
			</Button>

			<span class="offre-offer-guests-stepper__value">
				{{ modelValue }}
			</span>

			<Button
				type="button"
				variant="ghost"
				size="icon-lg"
				:disabled="incrementDisabled"
				class="offre-offer-guests-stepper__button"
				@click="increment"
			>
				<PlusIcon class="offre-offer-guests-stepper__icon"/>
			</Button>
		</div>
	</div>
</template>

<style scoped src="./OffreOfferGuestsStepper.scss" lang="scss"></style>
