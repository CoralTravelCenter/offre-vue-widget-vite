<script setup lang="ts">
import {MapPinIcon, StarIcon,} from "lucide-vue-next";
import {computed} from "vue";
import type {B2CPriceSearchReference, B2CProduct} from "offre/api/types";
import OffreOfferPricingPanel from "offre/components/results/OffreOfferPricingPanel.vue";
import OffreOfferTerms from "offre/components/results/OffreOfferTerms.vue";
import {useCoralBonus} from "offre/composables/useCoralBonus";
import {useHotelOfferQuery} from "offre/composables/useHotelOfferQuery";
import {useOffreOfferCard} from "offre/composables/useOffreOfferCard";
import type {NormalizedOffreWidgetOptions} from "offre/lib/payload";
import type {OffreHotelRuntimeEntry, OffreTourType} from "offre/types";
import type {BrandKey} from "shared/types/brand";
import {Badge} from "ui/badge";
import {Skeleton} from "ui/skeleton";

const props = defineProps<{
	product: B2CProduct;
	productReference: B2CPriceSearchReference;
	selectedDepartureName?: string;
	pricingMode?: unknown;
	searchOptions: NormalizedOffreWidgetOptions;
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
	searchOptionsSource: () => props.searchOptions,
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

const {cashbackInfo} = useCoralBonus({
	brandKey: () => props.brandKey,
	hotel: () => props.product.hotel,
	offer: effectiveOffer,
	hotelStarCount,
	currentPriceValue,
	tourType: selectedTourType,
	isHotelOnly
});

const starItems = computed(() => {
	return Array.from({length: 5}, (_, index) => index < hotelStarCount.value);
});
</script>

<template>
	<article class="offre-offer-card flex h-full flex-col overflow-visible border border-brand-border bg-brand-card p-2">
		<div class="offre-offer-card__media relative">
			<a
					:href="offerHref"
					class="offre-offer-card__media-link block h-full overflow-hidden rounded-[inherit]"
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
						class="offre-offer-card__image-placeholder h-50 w-full bg-brand-muted"
				/>
			</a>

			<div class="offre-offer-card__badges absolute left-2.5 top-2.5 flex flex-col gap-2">
				<Badge
						v-if="isRecommended"
						class="offre-offer-card__badge offre-offer-card__badge--recommended border-transparent bg-brand-card text-brand-foreground"
				>
					Рекомендуем
				</Badge>
				<Badge
						v-if="isExclusive"
						class="offre-offer-card__badge offre-offer-card__badge--exclusive border-transparent text-brand-primary-foreground"
				>
					Эксклюзив
				</Badge>
			</div>
		</div>

		<div class="offre-offer-card__body min-w-0 py-2">
			<div
					v-if="locationLabel"
					class="offre-offer-card__location mb-1 inline-flex self-start font-light text-brand-muted-foreground"
			>
				<MapPinIcon class="offre-offer-card__location-icon mb-0.5 mr-1 h-3.5 w-3 shrink-0"/>
				<span class="offre-offer-card__location-text truncate">{{ locationLabel }}</span>
			</div>

			<a
					:href="offerHref"
					class="offre-offer-card__title-link mb-1 block w-fit text-inherit no-underline hover:text-brand-primary hover:underline"
					rel="noopener noreferrer"
					target="_blank"
			>
				<h3
						:class="[
            'offre-offer-card__title m-0 wrap-break-word text-brand-foreground',
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
							:class="isFilled ? 'offre-offer-card__star offre-offer-card__star--filled h-5 w-5 fill-current' : 'offre-offer-card__star h-5 w-5 text-brand-border'"
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
							class="offre-offer-card__label offre-offer-card__label--elite inline-grid place-content-center border-transparent"
					>
						Elite Service
					</Badge>

					<Badge
							v-if="hasFamilyClub"
							class="offre-offer-card__label offre-offer-card__label--family inline-grid place-content-center border-transparent bg-brand-accent text-brand-accent-foreground"
					>
						Family Club
					</Badge>
				</div>
			</div>

			<div v-if="hotelOfferLoading" class="offre-offer-card__terms-skeleton" aria-hidden="true">
				<Skeleton
						v-for="index in 4"
						:key="`term-skeleton-${index}`"
						class="offre-offer-card__terms-skeleton-item"
				/>
			</div>
			<OffreOfferTerms
					v-else
					:terms="terms"
					class="offre-offer-card__terms"
			/>

			<ul
					v-if="hotelUsps.length"
					class="offre-offer-card__usp-list mt-2 grid max-h-34.25 list-none grid-flow-col grid-rows-[repeat(auto-fill,minmax(16px,min-content))] gap-x-4 gap-y-1 border-t border-brand-border pt-2 text-brand-foreground/80"
			>
				<li
						v-for="usp in hotelUsps"
						:key="usp"
						class="offre-offer-card__usp-item flex"
				>
					<span class="offre-offer-card__usp-bullet mr-1.5 text-brand-primary">•</span>
					<span class="offre-offer-card__usp-text">{{ usp }}</span>
				</li>
			</ul>
		</div>

		<OffreOfferPricingPanel
				v-model="selectedTourType"
				:disabled="hotelOfferLoading"
				:loading="hotelOfferLoading"
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
	--offre-offer-card-skeleton-fill: color-mix(in srgb, var(--brand-foreground) 10%, transparent);
	border-radius: var(--brand-radius-card);

	@media (min-width: 1024px) {
		display: grid;
		align-items: stretch;
		grid-template-columns: 240px minmax(0, 1fr) 320px;
		gap: 16px;
	}

	@media (min-width: 1280px) {
		grid-template-columns: 300px minmax(0, 1fr) 300px;
	}
}

.offre-offer-card__image,
.offre-offer-card__image-placeholder {
  border-radius: var(--brand-radius-media);

  @media (min-width: 1024px) {
    height: 100%;
		min-height: 240px;
	}

	@media (min-width: 1280px) {
		min-height: 260px;
	}
}

.offre-offer-card__terms-skeleton {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.offre-offer-card__terms-skeleton-item {
	background-color: var(--offre-offer-card-skeleton-fill);
	height: 16px;
}

.offre-offer-card__terms-skeleton-item:nth-child(1) {
	width: 34%;
}

.offre-offer-card__terms-skeleton-item:nth-child(2) {
	width: 28%;
}

.offre-offer-card__terms-skeleton-item:nth-child(3) {
	width: 32%;
}

.offre-offer-card__terms-skeleton-item:nth-child(4) {
	width: 38%;
}

.offre-offer-card__badge {
	border-radius: var(--brand-radius-media);
	font-size: var(--brand-text-meta);
	font-weight: 400;
	line-height: 1;
	padding: 4px 8px;
}

.offre-offer-card__badge--exclusive {
	background: var(--brand-exclusive);
}

.offre-offer-card__location {
	font-size: var(--brand-text-meta);
	line-height: var(--brand-leading-meta);
}

.offre-offer-card__title {
  font-size: var(--brand-text-title);
  line-height: var(--brand-leading-title);
}

.offre-offer-card__title-link {
  transition: color 0.15s ease;
}

.offre-offer-card__star--filled,
.offre-offer-card__category {
	color: var(--brand-star);
}

.offre-offer-card__category,
.offre-offer-card__usp-list {
	font-size: var(--brand-text-body);
}

.offre-offer-card__label {
	border-radius: var(--brand-radius-segment);
	font-size: var(--brand-text-meta);
	font-weight: 300;
	height: 24px;
	line-height: 1;
	padding: 0 12px;
}

.offre-offer-card__label--elite {
	background-color: var(--brand-foreground);
	color: var(--brand-card);
}

.offre-offer-card__body {
	@media (min-width: 1024px) {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0;
	}
}

.offre-offer-card__title-link {
	@media (min-width: 1024px) {
		margin-bottom: 8px;
	}
}

.offre-offer-card__meta {
	@media (min-width: 1024px) {
		margin-bottom: 0;
	}
}

.offre-offer-card__terms,
.offre-offer-card__terms-skeleton {
	@media (min-width: 1024px) {
		margin: 16px 0;
	}
}

.offre-offer-card__usp-list {
	@media (min-width: 1024px) {
		border-top: 0;
		margin-top: 0;
		padding-top: 0;
		padding-left: 8px;
	}
}
</style>
