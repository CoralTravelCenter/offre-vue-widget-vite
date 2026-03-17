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
  <Select v-model="modelValue" :disabled="disabled">
    <SelectTrigger
        class="text-sm border rounded-lg flex-1">
      <SelectValue :placeholder="placeholder"/>
    </SelectTrigger>
    <SelectContent :body-lock="false" class="rounded-lg">
      <SelectItem
          v-for="option in options"
          :key="option.id"
          :value="option.id"
          :text-value="option.label"
      >
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
