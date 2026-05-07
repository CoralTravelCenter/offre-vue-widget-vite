<script setup lang="ts">
import OffreOfferCardSkeleton from "offre/components/results/OffreOfferCardSkeleton.vue";

interface Props {
  items?: number;
}

withDefaults(defineProps<Props>(), {
  items: 4
});
</script>

<template>
  <section class="offre-offers-list-skeleton grid grid-cols-1 gap-4 -mr-4 pr-4" aria-hidden="true">
    <OffreOfferCardSkeleton
      v-for="index in items"
      :key="index"
      class="offre-offers-list-skeleton__item overflow-hidden"
    />
  </section>
</template>

<style scoped lang="scss">
.offre-offers-list-skeleton {
  @media (min-width: 768px) and (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
