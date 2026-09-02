<script setup lang="ts">
import { nextTick, watch } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import OffreOfferCard from "@/offre/components/results/OffreOfferCard/OffreOfferCard.vue";
import { useOffreOffersListState } from "@/offre/composables/useOffreOffersListState";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import type { OffreHotelRuntimeEntry, OffreTourType } from "@/offre/types";
import type { BrandKey } from "@/brands/types";
import { markOffrePerformance, OFFRE_PERFORMANCE_MARKS } from "@/lib/offre-performance";

const props = defineProps<{
  instanceId: string;
  products: B2CProduct[];
  productReference: B2CPriceSearchReference;
  selectedDepartureName?: string;
  pricingMode?: unknown;
  searchOptions: NormalizedOffreWidgetOptions;
  hotelRuntimeById: Map<string, OffreHotelRuntimeEntry>;
  tourTypeByHotelId: Record<string, OffreTourType>;
  brandKey: BrandKey;
}>();

const emit = defineEmits<{
  "update-tour-type": [hotelId: string, value: OffreTourType];
}>();

const { normalizedProducts } = useOffreOffersListState({
  productsSource: () => props.products,
  hotelRuntimeByIdSource: () => props.hotelRuntimeById,
  tourTypeByHotelIdSource: () => props.tourTypeByHotelId
});

let hasMarkedFirstCard = false;
let hasMarkedFirstImage = false;

watch(
  () => normalizedProducts.value.length,
  async (productsCount) => {
    if (hasMarkedFirstCard || productsCount === 0) {
      return;
    }

    await nextTick();
    hasMarkedFirstCard = true;
    markOffrePerformance(OFFRE_PERFORMANCE_MARKS.firstCardRendered, {
      instanceId: props.instanceId,
      productsCount
    });
  },
  { immediate: true }
);

function handleImageLoaded() {
  if (hasMarkedFirstImage) {
    return;
  }

  hasMarkedFirstImage = true;
  markOffrePerformance(OFFRE_PERFORMANCE_MARKS.firstImageLoaded, {
    instanceId: props.instanceId
  });
}
</script>

<template>
  <ul class="offre-offers-list offers-list">
    <li
      v-for="entry in normalizedProducts"
      :key="entry.key"
      class="offre-offers-list__item"
    >
      <OffreOfferCard
        :product="entry.product"
        :product-reference="productReference"
        :selected-departure-name="selectedDepartureName"
        :pricing-mode="pricingMode"
        :search-options="searchOptions"
        :hotel-runtime-entry="entry.hotelRuntimeEntry"
        :brand-key="brandKey"
        :tour-type="entry.tourType"
        @image-loaded="handleImageLoaded"
        @update:tour-type="emit('update-tour-type', entry.hotelId, $event)"
      />
    </li>
  </ul>
</template>

<style scoped src="./OffreOffersList.scss" lang="scss"></style>
