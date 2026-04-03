<script setup lang="ts">
import { MinusIcon, PlusIcon } from "lucide-vue-next";

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
    <span class="offre-offer-guests-stepper__label">{{ label }}</span>
    <div class="offre-offer-guests-stepper__controls">
      <button
        type="button"
        class="offre-offer-guests-stepper__button"
        :disabled="decrementDisabled"
        @click="decrement"
      >
        <MinusIcon class="size-4" />
      </button>
      <span class="offre-offer-guests-stepper__value">{{ modelValue }}</span>
      <button
        type="button"
        class="offre-offer-guests-stepper__button"
        :disabled="incrementDisabled"
        @click="increment"
      >
        <PlusIcon class="size-4" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.offre-offer-guests-stepper {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.offre-offer-guests-stepper__label {
  color: #262626;
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
}

.offre-offer-guests-stepper__controls {
  align-items: center;
  display: inline-flex;
  gap: 8px;
}

.offre-offer-guests-stepper__button {
  align-items: center;
  background: transparent;
  border: 1px solid var(--offre-color-control-border);
  border-radius: 8px;
  color: #262626;
  cursor: pointer;
  display: inline-flex;
  height: 26px;
  justify-content: center;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
  width: 26px;

  &:hover:not(:disabled) {
    background-color: transparent;
    border-color: rgb(74 158 212);
    color: rgb(74 158 212);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.offre-offer-guests-stepper__value {
  color: #262626;
  font-size: var(--offre-text-body);
  line-height: 1.25rem;
  min-width: 20px;
  text-align: center;
}
</style>
