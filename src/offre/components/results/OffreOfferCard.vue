<script setup lang="ts">
import {
  MapPinIcon,
  StarIcon,
} from "lucide-vue-next";
import { computed } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import OffreOfferPricingPanel from "offre/components/results/OffreOfferPricingPanel.vue";
import OffreOfferTerms from "offre/components/results/OffreOfferTerms.vue";
import { useCoralBonus } from "offre/composables/useCoralBonus";
import { useHotelOfferQuery } from "offre/composables/useHotelOfferQuery";
import { useOffreOfferCard } from "offre/composables/useOffreOfferCard";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";
import type { BrandKey } from "shared/types/brand";
import { Badge } from "ui/badge";

const props = defineProps<{
  product: B2CProduct;
  productReference: B2CPriceSearchReference;
  selectedDepartureName?: string;
  pricingMode?: unknown;
  hotelRuntimeEntry?: OffreHotelRuntimeEntry | null;
  tourType?: OffreTourType;
  brandKey: BrandKey;
}>();

const emit = defineEmits<{
  "update:tour-type": [value: OffreTourType];
}>();

const baseOffer = computed(() => props.product.offers?.[0] ?? null);
const isHotelOnly = computed(() => Boolean(props.hotelRuntimeEntry?.onlyhotel));
const selectedTourType = computed<OffreTourType>({
  get() {
    return isHotelOnly.value ? "hotel" : (props.tourType ?? "package");
  },
  set(value) {
    emit("update:tour-type", value === "hotel" ? "hotel" : "package");
  }
});

const {
  hotelOffer,
  hotelOfferQuery
} = useHotelOfferQuery({
  hotelSource: () => props.product.hotel,
  packageOfferSource: baseOffer,
  enabledSource: computed(() => selectedTourType.value === "hotel" && !isHotelOnly.value)
});

const effectiveOffer = computed(() => {
  if (selectedTourType.value === "hotel") {
    return hotelOffer.value ?? baseOffer.value;
  }

  return baseOffer.value;
});
const hotelOfferLoading = computed(() => {
  return selectedTourType.value === "hotel" && hotelOfferQuery.isPending.value;
});

const {
  currentPriceValue,
  currentPriceLabel,
  discountPercent,
  hasFamilyClub,
  hasOfferHref,
  hotelCategoryName,
  hotelName,
  hotelStarCount,
  hotelUsps,
  imageUrl,
  isEliteHotel,
  isExclusive,
  isRecommended,
  locationLabel,
  offerHref,
  oldPriceLabel,
  priceSuffix,
  terms
} = useOffreOfferCard({
  product: () => props.product,
  offer: effectiveOffer,
  productReference: () => props.productReference,
  selectedDepartureName: () => props.selectedDepartureName ?? "",
  pricingMode: () => props.pricingMode,
  tourType: selectedTourType,
  hotelRuntimeEntry: () => props.hotelRuntimeEntry ?? null
});

const { cashbackInfo } = useCoralBonus({
  brandKey: () => props.brandKey,
  hotel: () => props.product.hotel,
  offer: effectiveOffer,
  hotelStarCount,
  currentPriceValue,
  tourType: selectedTourType,
  isHotelOnly
});

const starItems = computed(() => {
  return Array.from({ length: 5 }, (_, index) => index < hotelStarCount.value);
});
</script>

<template>
  <article class="offre-offer-card flex h-full flex-col overflow-visible border border-border bg-white p-2">
    <div class="offre-offer-card__media relative">
      <a
        :href="offerHref"
        class="offre-offer-card__media-link block h-full"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="hotelName"
          class="offre-offer-card__image block h-50 w-full object-cover"
        >
        <div
          v-else
          class="offre-offer-card__image-placeholder h-50 w-full bg-muted"
        />
      </a>

      <div class="offre-offer-card__badges absolute left-2.5 top-2.5 flex flex-col gap-2">
        <Badge
          v-if="isRecommended"
          class="offre-offer-card__badge offre-offer-card__badge--recommended border-transparent bg-white px-2 py-1 font-normal leading-none text-black"
        >
          Рекомендуем
        </Badge>
        <Badge
          v-if="isExclusive"
          class="offre-offer-card__badge offre-offer-card__badge--exclusive border-transparent px-2 py-1 font-normal leading-none text-primary-foreground"
        >
          Эксклюзив
        </Badge>
      </div>
    </div>

    <div class="offre-offer-card__body min-w-0 py-2">
      <div
        v-if="locationLabel"
        class="offre-offer-card__location mb-1 inline-flex self-start font-light text-muted-foreground"
      >
        <MapPinIcon class="offre-offer-card__location-icon mb-0.5 mr-1 h-3.5 w-3 shrink-0"/>
        <span class="offre-offer-card__location-text truncate">{{ locationLabel }}</span>
      </div>

      <a
        :href="offerHref"
        class="offre-offer-card__title-link mb-1 block min-w-0 text-inherit no-underline hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        <h3
          :class="[
            'offre-offer-card__title m-0 break-words text-foreground',
            isEliteHotel
              ? 'font-normal tracking-[0.015em]'
              : 'font-bold'
          ]"
        >
          {{ hotelName }}
        </h3>
      </a>

      <div class="offre-offer-card__meta mb-2 flex flex-wrap items-center gap-2">
        <div
          v-if="hotelStarCount > 0"
          class="offre-offer-card__stars inline-flex gap-1"
        >
          <StarIcon
            v-for="(isFilled, index) in starItems"
            :key="`hotel-star-${index}`"
            :class="isFilled ? 'offre-offer-card__star offre-offer-card__star--filled h-5 w-5 fill-current' : 'offre-offer-card__star h-5 w-5 text-border'"
          />
        </div>
        <span
          v-else-if="hotelCategoryName"
          class="offre-offer-card__category"
        >
          {{ hotelCategoryName }}
        </span>

        <div
          v-if="isEliteHotel || hasFamilyClub"
          class="offre-offer-card__labels flex flex-wrap items-center gap-2"
        >
          <Badge
            v-if="isEliteHotel"
            class="offre-offer-card__label offre-offer-card__label--elite inline-grid h-6 place-content-center border-transparent bg-black px-3 font-light leading-none text-white"
          >
            Elite Service
          </Badge>

          <Badge
            v-if="hasFamilyClub"
            class="offre-offer-card__label offre-offer-card__label--family inline-grid h-6 place-content-center border-transparent bg-accent px-3 font-light leading-none text-accent-foreground"
          >
            Family Club
          </Badge>
        </div>
      </div>

      <OffreOfferTerms
        :terms="terms"
        class="offre-offer-card__terms"
      />

      <ul
        v-if="hotelUsps.length"
        class="offre-offer-card__usp-list mt-2 grid max-h-34.25 list-none grid-flow-col grid-rows-[repeat(auto-fill,minmax(16px,min-content))] gap-x-4 gap-y-1 border-t border-border pt-2 text-foreground/80"
      >
        <li
          v-for="usp in hotelUsps"
          :key="usp"
          class="offre-offer-card__usp-item flex"
        >
          <span class="offre-offer-card__usp-bullet mr-1.5 text-primary">•</span>
          <span class="offre-offer-card__usp-text">{{ usp }}</span>
        </li>
      </ul>
    </div>

    <OffreOfferPricingPanel
      v-model="selectedTourType"
      :disabled="hotelOfferLoading"
      :is-hotel-only="isHotelOnly"
      :old-price-label="oldPriceLabel"
      :current-price-label="currentPriceLabel"
      :price-suffix="priceSuffix"
      :discount-percent="discountPercent"
      :has-offer-href="hasOfferHref"
      :offer-href="offerHref"
      :cashback-info="cashbackInfo"
      class="offre-offer-card__aside"
    />
  </article>
</template>

<style scoped lang="scss">
.offre-offer-card {
  border-radius: var(--offre-radius-card);

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) 220px;
    gap: 16px;
  }
}

.offre-offer-card__image,
.offre-offer-card__image-placeholder {
  border-radius: var(--offre-radius-media);

  @media (min-width: 1024px) {
    height: 100%;
  }
}

.offre-offer-card__badge {
  border-radius: var(--offre-radius-media);
  font-size: var(--offre-text-meta);
}

.offre-offer-card__badge--exclusive {
  background: var(--offre-color-exclusive);
}

.offre-offer-card__location {
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
}

.offre-offer-card__title {
  font-size: var(--offre-text-title);
  line-height: var(--offre-leading-title);
}

.offre-offer-card__star--filled,
.offre-offer-card__category {
  color: var(--offre-color-star);
}

.offre-offer-card__category,
.offre-offer-card__usp-list {
  font-size: var(--offre-text-body);
}

.offre-offer-card__label {
  border-radius: var(--offre-radius-segment);
  font-size: var(--offre-text-meta);
}
</style>
