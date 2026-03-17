<script setup lang="ts">
import {
  BedDoubleIcon,
  CalendarIcon,
  MapPinIcon,
  PlaneIcon,
  StarIcon,
  UtensilsCrossedIcon
} from "lucide-vue-next";
import { computed } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import OffreTourTypeTabs from "offre/components/results/OffreTourTypeTabs.vue";
import { useHotelOfferQuery } from "offre/composables/useHotelOfferQuery";
import { useOffreOfferCard, type OffreOfferCardTermIcon } from "offre/composables/useOffreOfferCard";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";
import { Badge } from "ui/badge";
import { Button } from "ui/button";

const props = defineProps<{
  product: B2CProduct;
  productReference: B2CPriceSearchReference;
  selectedDepartureName?: string;
  pricingMode?: unknown;
  hotelRuntimeEntry?: OffreHotelRuntimeEntry | null;
  tourType?: OffreTourType;
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

const termIconByKey: Record<OffreOfferCardTermIcon, typeof PlaneIcon> = {
  flight: PlaneIcon,
  calendar: CalendarIcon,
  bed: BedDoubleIcon,
  meal: UtensilsCrossedIcon
};

const termIconClassByKey: Record<OffreOfferCardTermIcon, string> = {
  flight: "h-3 w-5.5",
  calendar: "h-3 w-3.5",
  bed: "h-3 w-4.25",
  meal: "h-3 w-4.75"
};

const starItems = computed(() => {
  return Array.from({ length: 5 }, (_, index) => index < hotelStarCount.value);
});
</script>

<template>
  <article class="rounded-[20px] border border-border bg-white p-2 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_220px] xl:gap-4">
    <div class="relative mb-4 xl:mb-0">
      <a
        :href="offerHref"
        class="block h-full"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="hotelName"
          class="block h-50 w-full rounded-[12px] object-cover xl:h-full"
        >
        <div
          v-else
          class="h-50 w-full rounded-[12px] bg-muted xl:h-full"
        />
      </a>

      <div class="absolute left-2.5 top-2.5 flex flex-col gap-2">
        <Badge
          v-if="isRecommended"
          class="rounded-[12px] border-transparent bg-white px-2 py-1 text-[12px] font-normal leading-none text-black shadow-none"
        >
          Рекомендуем
        </Badge>
        <Badge
          v-if="isExclusive"
          class="rounded-[12px] border-transparent bg-primary px-2 py-1 text-[12px] font-normal leading-none text-primary-foreground shadow-none"
        >
          Эксклюзив
        </Badge>
      </div>
    </div>

    <div class="min-w-0 py-2">
      <div
        v-if="locationLabel"
        class="mb-1 inline-flex self-start text-[12px] font-light leading-[1.3] text-muted-foreground"
      >
        <MapPinIcon class="mb-0.5 mr-1 h-3.5 w-3 shrink-0"/>
        <span class="truncate">{{ locationLabel }}</span>
      </div>

      <a
        :href="offerHref"
        class="mb-1 inline-block text-inherit no-underline hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        <h3
          :class="[
            'm-0 text-[20px] text-foreground',
            isEliteHotel
              ? 'font-normal leading-[1.2] tracking-[0.015em]'
              : 'font-bold leading-[1.2]'
          ]"
        >
          {{ hotelName }}
        </h3>
      </a>

      <div class="mb-2 flex flex-wrap items-center gap-2">
        <div
          v-if="hotelStarCount > 0"
          class="inline-flex gap-1"
        >
          <StarIcon
            v-for="(isFilled, index) in starItems"
            :key="`hotel-star-${index}`"
            :class="isFilled ? 'h-5 w-5 fill-current text-[#FADB14]' : 'h-5 w-5 text-border'"
          />
        </div>
        <span
          v-else-if="hotelCategoryName"
          class="text-[14px] text-[#FADB14]"
        >
          {{ hotelCategoryName }}
        </span>

        <div
          v-if="isEliteHotel || hasFamilyClub"
          class="flex flex-wrap items-center gap-2"
        >
          <Badge
            v-if="isEliteHotel"
            class="inline-grid h-6 place-content-center rounded-[6px] border-transparent bg-black px-3 text-[12px] font-light leading-none text-white"
          >
            Elite Service
          </Badge>

          <Badge
            v-if="hasFamilyClub"
            class="inline-grid h-6 place-content-center rounded-[6px] border-transparent bg-accent px-3 text-[12px] font-light leading-none text-accent-foreground"
          >
            Family Club
          </Badge>
        </div>
      </div>

      <ul
        v-if="terms.length"
        class="m-0 flex list-none flex-wrap items-baseline gap-1 p-0 text-[12px] leading-[1.3] text-muted-foreground"
      >
        <li
          v-for="term in terms"
          :key="term.key"
          class="inline-flex items-center gap-1"
        >
          <component
            :is="termIconByKey[term.icon]"
            :class="`${termIconClassByKey[term.icon]} shrink-0 object-contain`"
          />
          <span>{{ term.value }}</span>
        </li>
      </ul>

      <ul
        v-if="hotelUsps.length"
        class="mt-2 grid max-h-34.25 list-none grid-flow-col grid-rows-[repeat(auto-fill,minmax(16px,min-content))] gap-x-4 gap-y-1 border-t border-border pt-2 text-[14px] text-foreground/80"
      >
        <li
          v-for="usp in hotelUsps"
          :key="usp"
          class="flex"
        >
          <span class="mr-1.5 text-primary">•</span>
          <span>{{ usp }}</span>
        </li>
      </ul>
    </div>

    <div class="mt-4 flex min-w-0 flex-col gap-2 border-t border-border pt-2 xl:mt-0 xl:border-l xl:border-t-0 xl:border-border xl:pl-3 xl:pt-0">
      <OffreTourTypeTabs
        v-model="selectedTourType"
        :disabled="hotelOfferLoading"
        :is-hotel-only="isHotelOnly"
      />

      <div class="relative">
        <div class="text-[10px] leading-3.5 text-muted-foreground">
          цена от:
        </div>

        <div
          v-if="oldPriceLabel"
          class="text-[14px] leading-5.5 text-muted-foreground line-through decoration-destructive"
        >
          {{ oldPriceLabel }}
        </div>

        <div class="flex flex-wrap items-baseline gap-1 leading-7">
          <div class="text-[24px] font-semibold leading-7 text-primary">
            {{ currentPriceLabel || "Цена по запросу" }}
          </div>
          <span
            v-if="currentPriceLabel && priceSuffix"
            class="text-[20px] font-light leading-7 text-primary"
          >
            {{ priceSuffix }}
          </span>
        </div>

        <div
          v-if="discountPercent"
          class="absolute bottom-0 right-1 grid h-6 translate-x-5.5 place-content-center rounded-[6px_6px_0_6px] bg-green-600 px-3 text-[12px] leading-none text-white"
        >
          {{ discountPercent }}% Скидка
        </div>
      </div>

      <Button
        v-if="hasOfferHref"
        as="a"
        :href="offerHref"
        :class="hotelOfferLoading ? 'pointer-events-none opacity-60' : ''"
        class="h-12 w-full rounded-lg px-4 py-3 text-[16px] leading-[1.3]"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ hotelOfferLoading ? "Загрузка..." : "Выбрать" }}
      </Button>

      <Button
        v-else
        class="h-12 w-full rounded-lg px-4 py-3 text-[16px] leading-[1.3]"
        disabled
      >
        Недоступно
      </Button>
    </div>
  </article>
</template>
