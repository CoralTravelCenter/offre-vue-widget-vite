<script setup lang="ts">
import {computed} from "vue";
import {Skeleton} from "@/shared/components/ui/skeleton";

interface Props {
  items?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: 4
});

const itemWidths = computed(() => {
  return Array.from({length: props.items}, (_, index) => {
    const widths = ["112px", "136px", "128px", "104px", "120px", "96px"];
    return widths[index % widths.length];
  });
});
</script>

<template>
  <div
    class="region-tabs-nav-skeleton flex items-center gap-2 overflow-hidden px-2"
    style="--offre-region-tabs-skeleton-fill: color-mix(in srgb, var(--brand-foreground) 10%, transparent);"
    aria-hidden="true"
  >
    <Skeleton
      v-for="(width, index) in itemWidths"
      :key="index"
      class="region-tabs-nav-skeleton__item h-10 rounded-full [background-color:var(--offre-region-tabs-skeleton-fill)]"
      :style="{width}"
    />
  </div>
</template>
