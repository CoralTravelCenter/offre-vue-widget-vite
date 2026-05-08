<script setup lang="ts">
import {MinusIcon, PlusIcon} from "lucide-vue-next";
import {Button} from "ui/button";

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
	<div class="offre-offer-guests-stepper grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
    <span
				class="offre-offer-guests-stepper__label text-[length:var(--brand-text-body)] font-normal leading-[var(--brand-leading-control)] text-brand-foreground/80">
      {{ label }}
    </span>

		<div class="offre-offer-guests-stepper__controls inline-flex items-center gap-[var(--brand-stepper-gap)]">
			<Button
					type="button"
					variant="ghost"
					size="icon"
					:disabled="decrementDisabled"
					class="offre-offer-guests-stepper__button h-6 w-6 rounded-[var(--brand-stepper-button-radius)] bg-[var(--brand-stepper-button-background)] p-0 text-[var(--brand-stepper-button-foreground)] transition-colors hover:bg-[var(--brand-stepper-button-background)] hover:text-brand-primary disabled:bg-[var(--brand-stepper-button-background)] disabled:text-[color-mix(in_srgb,var(--brand-stepper-button-foreground)_40%,transparent)]"
					@click="decrement"
			>
				<MinusIcon
						class="offre-offer-guests-stepper__icon h-[var(--brand-stepper-icon-size)] w-[var(--brand-stepper-icon-size)]"/>
			</Button>

			<span
					class="offre-offer-guests-stepper__value min-w-[var(--brand-stepper-value-min-width)] text-center font-normal text-[length:var(--brand-text-body)] leading-[var(--brand-leading-control)] text-brand-foreground tabular-nums">
        {{ modelValue }}
      </span>

			<Button
					type="button"
					variant="ghost"
					size="icon-lg"
					:disabled="incrementDisabled"
					class="offre-offer-guests-stepper__button h-6 w-6 rounded-[var(--brand-stepper-button-radius)] bg-[var(--brand-stepper-button-background)] p-0 text-[var(--brand-stepper-button-foreground)] transition-colors hover:bg-[var(--brand-stepper-button-background)] hover:text-brand-primary disabled:bg-[var(--brand-stepper-button-background)] disabled:text-[color-mix(in_srgb,var(--brand-stepper-button-foreground)_40%,transparent)]"
					@click="increment"
			>
				<PlusIcon class="offre-offer-guests-stepper__icon h-[var(--brand-stepper-icon-size)] w-[var(--brand-stepper-icon-size)]"/>
			</Button>
		</div>
	</div>
</template>
