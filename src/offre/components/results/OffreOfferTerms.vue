<script setup lang="ts">
import type { Component } from "vue";
import AllInclusiveIcon from "offre/components/results/icons/AllInclusiveIcon.vue";
import DatesIcon from "offre/components/results/icons/DatesIcon.vue";
import FlightIcon from "offre/components/results/icons/FlightIcon.vue";
import NightsIcon from "offre/components/results/icons/NightsIcon.vue";
import type { OffreOfferCardTerm, OffreOfferCardTermIcon } from "offre/types/offer-card";

interface Props {
  terms: OffreOfferCardTerm[];
}

defineProps<Props>();

const termIconByKey: Record<OffreOfferCardTermIcon, Component> = {
  flight: FlightIcon,
  calendar: DatesIcon,
  bed: NightsIcon,
  meal: AllInclusiveIcon
};

const termIconClassByKey: Record<OffreOfferCardTermIcon, string> = {
  flight: "h-4 w-4",
  calendar: "h-4 w-4",
  bed: "h-4 w-4",
  meal: "h-4 w-4"
};
</script>

<template>
  <ul
    v-if="terms.length"
    class="offre-offer-terms m-0 flex list-none flex-wrap items-baseline gap-1 p-0 text-muted-foreground"
  >
    <li
      v-for="term in terms"
      :key="term.key"
      class="offre-offer-terms__item inline-flex items-center gap-1"
    >
      <component
        :is="termIconByKey[term.icon]"
        class="offre-offer-terms__icon h-4 w-4 shrink-0 object-contain"
      />
      <span class="offre-offer-terms__value">{{ term.value }}</span>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.offre-offer-terms {
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
}
</style>
