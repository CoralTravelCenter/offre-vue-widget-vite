<script setup lang="ts">
import { computed } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import OffreOfferCard from "offre/components/results/OffreOfferCard.vue";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";
import type { BrandKey } from "shared/types/brand";

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

const normalizedProducts = computed(() => {
  return props.products.map((product, index) => ({
    key: String(product.hotel?.id ?? product.hotel?.name ?? `product-${index}`),
    product,
    hotelRuntimeEntry: props.hotelRuntimeById.get(String(product.hotel?.id ?? "")) ?? null
  }));
});
</script>

<template>
  <section class="offre-offers-list grid grid-cols-1 gap-4">
    <OffreOfferCard
      v-for="entry in normalizedProducts"
      :key="entry.key"
      :product="entry.product"
      :product-reference="productReference"
      :selected-departure-name="selectedDepartureName"
      :pricing-mode="pricingMode"
      :search-options="searchOptions"
      :hotel-runtime-entry="entry.hotelRuntimeEntry"
      :brand-key="brandKey"
      :tour-type="tourTypeByHotelId[String(entry.product.hotel?.id ?? '')]"
      @update:tour-type="emit('update-tour-type', String(entry.product.hotel?.id ?? ''), $event)"
    />
  </section>
</template>

<style scoped lang="scss">
.offre-offers-list {
  margin-right: -16px;
  padding-right: 16px;

  @media (min-width: 768px) and (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
