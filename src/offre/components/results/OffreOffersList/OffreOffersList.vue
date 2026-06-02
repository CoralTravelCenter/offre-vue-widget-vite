<script setup lang="ts">
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import OffreOfferCard from "@/offre/components/results/OffreOfferCard/OffreOfferCard.vue";
import { useOffreOffersListState } from "@/offre/composables/useOffreOffersListState";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import type { OffreHotelRuntimeEntry, OffreTourType } from "@/offre/types";
import type { BrandKey } from "@/brands/types";

const props = defineProps<{
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
        @update:tour-type="emit('update-tour-type', entry.hotelId, $event)"
      />
    </li>
  </ul>
</template>

<style scoped src="./OffreOffersList.scss" lang="scss"></style>
