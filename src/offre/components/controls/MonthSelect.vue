<script setup lang="ts">
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/shared/components/ui/select";
import type {OffreControlOption} from "offre/types";

interface Props {
  options: OffreControlOption[];
  disabled?: boolean;
  placeholder?: string;
}

const modelValue = defineModel<string>({required: true});

defineProps<Props>()
</script>

<template>
  <div class="offre-month-select flex-1">
    <Select v-model="modelValue" :disabled="disabled">
      <SelectTrigger
        class="offre-month-select__trigger w-full rounded-lg border text-left text-sm"
      >
        <SelectValue :placeholder="placeholder" class="offre-month-select__value capitalize"/>
      </SelectTrigger>
      <SelectContent :body-lock="false" class="offre-month-select__content rounded-lg">
        <SelectItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="offre-month-select__item capitalize"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<style scoped lang="scss">
.offre-month-select {
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
