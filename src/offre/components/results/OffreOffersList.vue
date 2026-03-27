<script setup lang="ts">
import { computed } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import OffreOfferCard from "offre/components/results/OffreOfferCard.vue";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";
import type { BrandKey } from "shared/types/brand";

const props = defineProps<{
  products: B2CProduct[];
  productReference: B2CPriceSearchReference;
  selectedDepartureName?: string;
  pricingMode?: unknown;
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
  <section class="offre-offers-list grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
    <OffreOfferCard
      v-for="entry in normalizedProducts"
      :key="entry.key"
      :product="entry.product"
      :product-reference="productReference"
      :selected-departure-name="selectedDepartureName"
      :pricing-mode="pricingMode"
      :hotel-runtime-entry="entry.hotelRuntimeEntry"
      :brand-key="brandKey"
      :tour-type="tourTypeByHotelId[String(entry.product.hotel?.id ?? '')]"
      @update:tour-type="emit('update-tour-type', String(entry.product.hotel?.id ?? ''), $event)"
    />
  </section>
</template>
