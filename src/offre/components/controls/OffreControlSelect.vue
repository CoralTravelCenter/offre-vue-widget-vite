<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { HTMLAttributes } from "vue";

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

const modelValue = defineModel<string>({ required: true });

withDefaults(defineProps<Props>(), {
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
    "offre-control-select flex-1 lg:w-[150px] lg:flex-none xl:w-[180px]",
    disabled ? "offre-control-select--disabled" : "offre-control-select--enabled",
    rootClass
  ];
}
</script>

<template>
  <div :class="getRootClass(disabled, rootClass)">
    <Select v-model="modelValue" :disabled="disabled">
      <SelectTrigger
        size="brand"
        :class="[
          'offre-control-select__trigger h-[var(--brand-control-height)] w-full rounded-[var(--brand-radius-button)] border border-brand-control-border bg-brand-card px-4 py-0 text-left text-[length:var(--brand-text-control)] leading-[var(--brand-leading-control)] data-[state=open]:bg-brand-card hover:border-brand-primary hover:bg-brand-card hover:text-brand-primary',
          triggerClass
        ]"
      >
        <SelectValue :placeholder="placeholder" :class="['offre-control-select__value', valueClass]" />
      </SelectTrigger>

      <SelectContent
        :body-lock="false"
        :class="[
          'offre-control-select__content overflow-hidden rounded-[var(--brand-radius-media)] border-[color:var(--brand-border)] shadow-brand-popover',
          contentClass
        ]"
      >
        <SelectItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :text-value="option.label"
          :class="[
            'offre-control-select__item cursor-pointer rounded-[4px] px-3 py-[5px] pr-8 text-[length:var(--brand-text-control)] leading-[var(--brand-leading-control)] text-brand-foreground hover:text-brand-primary data-[highlighted]:bg-transparent data-[highlighted]:text-brand-primary data-[state=checked]:bg-[var(--brand-selected-surface)] data-[state=checked]:text-brand-primary',
            itemClass
          ]"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
