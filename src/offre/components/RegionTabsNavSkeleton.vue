<script setup lang="ts">
import { Skeleton } from "@/shared/components/ui/skeleton";

interface Props {
  items?: number;
}

withDefaults(defineProps<Props>(), {
  items: 4,
});
</script>

<template>
  <div
    class="flex items-center gap-2 overflow-hidden"
    aria-hidden="true"
  >
    <Skeleton
      v-for="index in items"
      :key="index"
      class="h-18 min-w-32 rounded-full"
    />
  </div>
</template>
