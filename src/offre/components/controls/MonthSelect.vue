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
  <Select v-model="modelValue" :disabled="disabled">
    <SelectTrigger
        class="text-left text-sm shadow-none border rounded-lg flex-1">
      <SelectValue :placeholder="placeholder" class="capitalize"/>
    </SelectTrigger>
    <SelectContent class="rounded-lg">
      <SelectItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="capitalize"
      >
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
