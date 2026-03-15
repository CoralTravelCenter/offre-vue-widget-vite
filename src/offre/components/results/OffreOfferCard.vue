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

const starItems = computed(() => {
  return Array.from({ length: 5 }, (_, index) => index < hotelStarCount.value);
});
</script>

<template>
  <article class="rounded-2xl border border-border bg-white p-2 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_220px] xl:gap-4">
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
          class="aspect-[4/3] w-full rounded-xl object-cover xl:h-full xl:aspect-auto"
        >
        <div
          v-else
          class="aspect-[4/3] rounded-xl bg-muted xl:h-full"
        />
      </a>

      <div class="absolute left-3 top-3 flex flex-col gap-2">
        <Badge
          v-if="isRecommended"
          class="rounded-lg border-transparent bg-white px-2.5 py-1 text-xs font-medium text-black shadow-none"
        >
          Рекомендуем
        </Badge>
        <Badge
          v-if="isExclusive"
          class="rounded-lg border-transparent bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-none"
        >
          Эксклюзив
        </Badge>
      </div>
    </div>

    <div class="min-w-0 space-y-3 xl:space-y-4">
      <div
        v-if="locationLabel"
        class="inline-flex items-center gap-1 text-xs text-muted-foreground"
      >
        <MapPinIcon class="size-3.5 shrink-0"/>
        <span class="truncate">{{ locationLabel }}</span>
      </div>

      <a
        :href="offerHref"
        class="block text-inherit no-underline hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        <h3 class="text-base font-semibold leading-tight text-foreground">
          {{ hotelName }}
        </h3>
      </a>

      <div class="flex flex-wrap items-center gap-2">
        <div
          v-if="hotelStarCount > 0"
          class="flex items-center gap-0.5"
        >
          <StarIcon
            v-for="(isFilled, index) in starItems"
            :key="`hotel-star-${index}`"
            :class="isFilled ? 'size-4 fill-current text-[#FADB14]' : 'size-4 text-border'"
          />
        </div>
        <span
          v-else-if="hotelCategoryName"
          class="text-sm text-[#FADB14]"
        >
          {{ hotelCategoryName }}
        </span>

        <div
          v-if="isEliteHotel || hasFamilyClub"
          class="flex flex-wrap items-center gap-2"
        >
          <Badge
            v-if="isEliteHotel"
            class="rounded-md border-transparent bg-black px-2 py-1 text-xs font-medium text-white"
          >
            Elite Service
          </Badge>

          <Badge
            v-if="hasFamilyClub"
            class="rounded-md border-transparent bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
          >
            Family Club
          </Badge>
        </div>
      </div>

      <ul
        v-if="terms.length"
        class="flex list-none flex-wrap gap-x-3 gap-y-2 p-0 text-sm text-muted-foreground"
      >
        <li
          v-for="term in terms"
          :key="term.key"
          class="inline-flex items-center gap-1"
        >
          <component
            :is="termIconByKey[term.icon]"
            class="size-4 shrink-0"
          />
          <span>{{ term.value }}</span>
        </li>
      </ul>

      <ul
        v-if="hotelUsps.length"
        class="grid list-none gap-1 border-t border-border pt-3 text-sm text-foreground/80"
      >
        <li
          v-for="usp in hotelUsps"
          :key="usp"
          class="flex items-start gap-2"
        >
          <span class="text-primary">•</span>
          <span>{{ usp }}</span>
        </li>
      </ul>
    </div>

    <div class="mt-4 flex min-w-0 flex-col gap-4 border-t border-border pt-4 xl:mt-0 xl:border-l xl:border-t-0 xl:border-border xl:pl-4">
      <OffreTourTypeTabs
        v-model="selectedTourType"
        :disabled="hotelOfferLoading"
        :is-hotel-only="isHotelOnly"
      />

      <div class="relative">
        <div class="text-xs text-muted-foreground">
          цена от:
        </div>

        <div
          v-if="oldPriceLabel"
          class="mt-1 text-sm text-muted-foreground line-through decoration-destructive"
        >
          {{ oldPriceLabel }}
        </div>

        <div class="mt-1 flex flex-wrap items-end gap-x-1 gap-y-1">
          <div class="text-xl font-semibold leading-none text-primary">
            {{ currentPriceLabel || "Цена по запросу" }}
          </div>
          <span
            v-if="currentPriceLabel && priceSuffix"
            class="text-sm leading-none text-primary"
          >
            {{ priceSuffix }}
          </span>
        </div>

        <div
          v-if="discountPercent"
          class="absolute right-0 top-0 rounded-lg bg-green-600 px-2 py-1 text-xs font-medium text-white"
        >
          {{ discountPercent }}% Скидка
        </div>
      </div>

      <Button
        v-if="hasOfferHref"
        as="a"
        :href="offerHref"
        :class="hotelOfferLoading ? 'pointer-events-none opacity-60' : ''"
        class="h-10 w-full rounded-lg"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ hotelOfferLoading ? "Загрузка..." : "Выбрать" }}
      </Button>

      <Button
        v-else
        class="h-10 w-full rounded-lg"
        disabled
      >
        Недоступно
      </Button>
    </div>
  </article>
</template>
