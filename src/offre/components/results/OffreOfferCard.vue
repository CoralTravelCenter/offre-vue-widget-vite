<script setup lang="ts">
import {
  BedDoubleIcon,
  MapPinIcon,
  StarIcon,
} from "lucide-vue-next";
import type { Component } from "vue";
import { computed } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import AllInclusiveIcon from "offre/components/results/icons/AllInclusiveIcon.vue";
import DatesIcon from "offre/components/results/icons/DatesIcon.vue";
import FlightIcon from "offre/components/results/icons/FlightIcon.vue";
import NightsIcon from "offre/components/results/icons/NightsIcon.vue";
import OffreCashbackBanner from "offre/components/results/OffreCashbackBanner.vue";
import OffreTourTypeTabs from "offre/components/results/OffreTourTypeTabs.vue";
import { useHotelOfferQuery } from "offre/composables/useHotelOfferQuery";
import { useOffreOfferCard, type OffreOfferCardTermIcon } from "offre/composables/useOffreOfferCard";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";
import type { BrandKey } from "shared/types/brand";
import { Badge } from "ui/badge";
import { Button } from "ui/button";

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

const starItems = computed(() => {
  return Array.from({ length: 5 }, (_, index) => index < hotelStarCount.value);
});

const showCashbackBanner = computed(() => props.brandKey === "coral");
</script>

<template>
  <article class="offre-offer-card flex h-full flex-col rounded-[20px] border border-border bg-white p-2 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_220px] lg:gap-4">
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
          class="offre-offer-card__image block h-50 w-full rounded-[12px] object-cover lg:h-full"
        >
        <div
          v-else
          class="offre-offer-card__image-placeholder h-50 w-full rounded-[12px] bg-muted lg:h-full"
        />
      </a>

      <div class="offre-offer-card__badges absolute left-2.5 top-2.5 flex flex-col gap-2">
        <Badge
          v-if="isRecommended"
          class="offre-offer-card__badge offre-offer-card__badge--recommended rounded-[12px] border-transparent bg-white px-2 py-1 text-[12px] font-normal leading-none text-black"
        >
          Рекомендуем
        </Badge>
        <Badge
          v-if="isExclusive"
          class="offre-offer-card__badge offre-offer-card__badge--exclusive rounded-[12px] border-transparent bg-[#E84F0E] px-2 py-1 text-[12px] font-normal leading-none text-primary-foreground"
        >
          Эксклюзив
        </Badge>
      </div>
    </div>

    <div class="offre-offer-card__body min-w-0 py-2">
      <div
        v-if="locationLabel"
        class="offre-offer-card__location mb-1 inline-flex self-start text-[12px] font-light leading-[1.3] text-muted-foreground"
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
            'offre-offer-card__title m-0 break-words text-[20px] text-foreground',
            isEliteHotel
              ? 'font-normal leading-[1.2] tracking-[0.015em]'
              : 'font-bold leading-[1.2]'
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
            :class="isFilled ? 'offre-offer-card__star h-5 w-5 fill-current text-[#FADB14]' : 'offre-offer-card__star h-5 w-5 text-border'"
          />
        </div>
        <span
          v-else-if="hotelCategoryName"
          class="offre-offer-card__category text-[14px] text-[#FADB14]"
        >
          {{ hotelCategoryName }}
        </span>

        <div
          v-if="isEliteHotel || hasFamilyClub"
          class="offre-offer-card__labels flex flex-wrap items-center gap-2"
        >
          <Badge
            v-if="isEliteHotel"
            class="offre-offer-card__label offre-offer-card__label--elite inline-grid h-6 place-content-center rounded-[6px] border-transparent bg-black px-3 text-[12px] font-light leading-none text-white"
          >
            Elite Service
          </Badge>

          <Badge
            v-if="hasFamilyClub"
            class="offre-offer-card__label offre-offer-card__label--family inline-grid h-6 place-content-center rounded-[6px] border-transparent bg-accent px-3 text-[12px] font-light leading-none text-accent-foreground"
          >
            Family Club
          </Badge>
        </div>
      </div>

      <ul
        v-if="terms.length"
        class="offre-offer-card__terms m-0 flex list-none flex-wrap items-baseline gap-1 p-0 text-[12px] leading-[1.3] text-muted-foreground"
      >
        <li
          v-for="term in terms"
          :key="term.key"
          class="offre-offer-card__term inline-flex items-center gap-1"
        >
          <component
            :is="termIconByKey[term.icon]"
            :class="`offre-offer-card__term-icon ${termIconClassByKey[term.icon]} shrink-0 object-contain`"
          />
          <span class="offre-offer-card__term-value">{{ term.value }}</span>
        </li>
      </ul>

      <ul
        v-if="hotelUsps.length"
        class="offre-offer-card__usp-list mt-2 grid max-h-34.25 list-none grid-flow-col grid-rows-[repeat(auto-fill,minmax(16px,min-content))] gap-x-4 gap-y-1 border-t border-border pt-2 text-[14px] text-foreground/80"
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

    <div class="offre-offer-card__aside mt-auto flex min-w-0 flex-col gap-2 border-t border-border pt-2 lg:mt-0 lg:h-full lg:justify-end lg:border-t-0 lg:border-l lg:border-border lg:pl-3 lg:pt-0">
      <OffreTourTypeTabs
        v-model="selectedTourType"
        :disabled="hotelOfferLoading"
        :is-hotel-only="isHotelOnly"
      />

      <div class="offre-offer-card__pricing relative">
        <div class="offre-offer-card__price-caption text-[10px] leading-3.5 text-muted-foreground">
          цена от:
        </div>

        <div
          v-if="oldPriceLabel"
          class="offre-offer-card__old-price text-[14px] leading-5.5 text-muted-foreground decoration-destructive line-through"
        >
          {{ oldPriceLabel }}
        </div>

        <div class="offre-offer-card__price-row flex flex-wrap items-baseline gap-1 leading-7">
          <div class="offre-offer-card__current-price text-[24px] font-semibold leading-7 text-primary">
            {{ currentPriceLabel || "Цена по запросу" }}
          </div>
          <span
            v-if="currentPriceLabel && priceSuffix"
            class="offre-offer-card__price-suffix text-[20px] font-light leading-7 text-primary"
          >
            {{ priceSuffix }}
          </span>
        </div>

        <div
          v-if="discountPercent"
          class="offre-offer-card__discount-badge absolute bottom-0 right-1 grid h-6 translate-x-5.5 place-content-center rounded-[4px_4px_0_4px] bg-[#52C41A] px-3 text-[12px] leading-none text-white"
        >
          {{ discountPercent }}% Скидка
        </div>
      </div>

      <OffreCashbackBanner
        v-if="showCashbackBanner"
        class="offre-offer-card__cashback"
      />

      <Button
        v-if="hasOfferHref"
        as="a"
        :href="offerHref"
        :class="[
          'offre-offer-card__action h-12 w-full rounded-[8px] px-4 py-3 text-[16px] leading-[1.3]',
          hotelOfferLoading ? 'pointer-events-none opacity-60' : ''
        ]"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ hotelOfferLoading ? "Загрузка..." : "Выбрать" }}
      </Button>

      <Button
        v-else
        class="offre-offer-card__action h-12 w-full rounded-[8px] px-4 py-3 text-[16px] leading-[1.3]"
        disabled
      >
        Недоступно
      </Button>
    </div>
  </article>
</template>

<style scoped>
.offre-offer-card__discount-badge {
  overflow: visible;
}

.offre-offer-card__discount-badge::after {
  content: "";
  position: absolute;
  top: 100%;
  right: 0;
  width: 8px;
  height: 6px;
  background: inherit;
  clip-path: polygon(100% 0, 0 0, 0 100%);
}
</style>
