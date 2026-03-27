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
    class="region-tabs-nav-skeleton flex items-center gap-2 overflow-hidden"
    aria-hidden="true"
  >
    <Skeleton
      v-for="index in items"
      :key="index"
      class="region-tabs-nav-skeleton__item min-w-32 rounded-full h-18"
    />
  </div>
</template>
