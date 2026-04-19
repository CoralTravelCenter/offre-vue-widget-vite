<script setup lang="ts">
import { MinusIcon, PlusIcon } from "lucide-vue-next";
import { Button } from "ui/button";

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
  <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
    <span class="text-[12px] font-normal leading-[1.2] text-[#3f3f46]">
      {{ label }}
    </span>

    <div class="inline-flex items-center gap-[12px]">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        :disabled="decrementDisabled"
        class="size-6 cursor-pointer rounded-[8px] bg-[#f5f5f5] p-0 text-[#2f2f35] transition-colors hover:bg-primary hover:text-primary-foreground"
        @click="decrement"
      >
        <MinusIcon class="size-2.5" />
      </Button>

      <span class="min-w-5 text-center text-[12px] font-normal leading-none text-[#2f2f35]">
        {{ modelValue }}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        :disabled="incrementDisabled"
        class="size-6 cursor-pointer rounded-[8px] bg-[#f5f5f5] p-0 text-[#2f2f35] transition-colors hover:bg-primary hover:text-primary-foreground"
        @click="increment"
      >
        <PlusIcon class="size-2.5" />
      </Button>
    </div>
  </div>
</template>
