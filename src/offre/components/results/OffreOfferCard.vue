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
	return Array.from({length: hotelStarCount.value}, () => true);
});

const hasLabels = computed(() => isEliteHotel.value || hasFamilyClub.value);
const hasUsps = computed(() => hotelUsps.value.length > 0);

function getTitleClass() {
	return [
		"offre-offer-card__title name m-0 text-[length:var(--brand-text-title)] font-semibold leading-[var(--brand-leading-title)] text-brand-foreground [overflow-wrap:anywhere]",
		isEliteHotel.value
			? "offre-offer-card__title--elite tracking-[0.015em]"
			: "offre-offer-card__title--default"
	];
}

function getBadgeClass(kind: "recommended" | "exclusive") {
	return [
		"offre-offer-card__badge rounded-[var(--brand-radius-badge)] border-transparent px-2 py-1 text-[length:var(--brand-text-meta)] font-normal leading-none",
		kind === "recommended"
			? "offre-offer-card__badge--recommended bg-brand-card text-brand-foreground"
			: "offre-offer-card__badge--exclusive exclusive bg-brand-exclusive text-brand-primary-foreground"
	];
}

function getLabelClass(kind: "elite" | "family") {
	return [
		"offre-offer-card__label inline-grid h-6 place-content-center rounded-[var(--brand-radius-segment)] border-transparent px-3 text-[length:var(--brand-text-meta)] font-normal leading-none uppercase",
		kind === "elite"
			? "offre-offer-card__label--elite bg-[var(--brand-elite-label-background,var(--brand-foreground))] text-[var(--brand-elite-label-foreground,var(--brand-card))]"
			: "offre-offer-card__label--family bg-brand-accent text-brand-accent-foreground"
	];
}
</script>

<template>
	<article class="offre-offer-card product-card flex h-full flex-col overflow-visible rounded-[var(--brand-radius-card)] border border-brand-border bg-brand-card p-2 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:items-stretch lg:gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
		<div class="offre-offer-card__media visual-details relative">
			<a
					:href="offerHref"
					class="offre-offer-card__media-link visual block h-full overflow-hidden rounded-[inherit]"
					rel="noopener noreferrer"
					target="_blank"
			>
				<img
						v-if="imageUrl"
						:src="imageUrl"
						:alt="hotelName"
					class="offre-offer-card__image block h-[var(--brand-offer-card-media-height)] w-full rounded-[var(--brand-radius-media)] object-cover lg:h-full lg:min-h-[var(--brand-offer-card-media-height-lg)] xl:min-h-[var(--brand-offer-card-media-height-xl)]"
				>
				<div
						v-else
						class="offre-offer-card__image-placeholder h-[var(--brand-offer-card-media-height)] w-full rounded-[var(--brand-radius-media)] bg-brand-muted lg:h-full lg:min-h-[var(--brand-offer-card-media-height-lg)] xl:min-h-[var(--brand-offer-card-media-height-xl)]"
				/>
			</a>

			<div class="offre-offer-card__badges badge-grid absolute left-[10px] top-[10px] flex flex-col gap-2">
				<Badge
						v-if="isRecommended"
						:class="getBadgeClass('recommended')"
				>
					Рекомендуем
				</Badge>
				<Badge
						v-if="isExclusive"
						:class="getBadgeClass('exclusive')"
				>
					Эксклюзив
				</Badge>
			</div>
		</div>

		<div class="offre-offer-card__body details min-w-0 py-2 lg:flex lg:flex-col lg:justify-center lg:py-0">
			<div
					v-if="locationLabel"
					class="offre-offer-card__location location mb-1 inline-flex self-start text-[length:var(--brand-text-meta)] font-normal leading-[var(--brand-leading-meta)] text-brand-muted-foreground"
			>
				<MapPinIcon class="offre-offer-card__location-icon mb-0.5 mr-1 h-[14px] w-3 shrink-0"/>
				<span class="offre-offer-card__location-text truncate">{{ locationLabel }}</span>
			</div>

			<a
					:href="offerHref"
					class="offre-offer-card__title-link hotel-name mb-1 block w-fit text-inherit no-underline transition-colors hover:text-brand-primary hover:underline lg:mb-2"
					rel="noopener noreferrer"
					target="_blank"
			>
				<h3
						:class="getTitleClass()"
				>
					{{ hotelName }}
				</h3>
			</a>

			<div class="offre-offer-card__meta category-concept mb-2 flex flex-wrap items-center gap-2 lg:mb-0">
				<div
						v-if="hotelStarCount > 0"
						class="offre-offer-card__stars stars inline-flex gap-1"
				>
					<StarIcon
							v-for="(_isFilled, index) in starItems"
							:key="`hotel-star-${index}`"
							class="offre-offer-card__star offre-offer-card__star--filled h-5 w-5 fill-current text-brand-star"
					/>
				</div>
				<span
						v-else-if="hotelCategoryName"
						class="offre-offer-card__category text-[length:var(--brand-text-body)] text-brand-star"
				>
          {{ hotelCategoryName }}
        </span>

				<div
						v-if="hasLabels"
						class="offre-offer-card__labels flex flex-wrap items-center gap-2"
				>
					<Badge
							v-if="isEliteHotel"
							:class="getLabelClass('elite')"
					>
						ELITE SERVICE
					</Badge>

					<Badge
							v-if="hasFamilyClub"
							:class="getLabelClass('family')"
					>
						CORAL FAMILY CLUB
					</Badge>
				</div>
			</div>

			<div v-if="hotelOfferLoading" class="offre-offer-card__terms-skeleton flex flex-wrap gap-2 lg:my-4" aria-hidden="true">
				<Skeleton
						v-for="width in ['w-[34%]', 'w-[28%]', 'w-[32%]', 'w-[38%]']"
						:key="width"
						:class="['offre-offer-card__terms-skeleton-item h-4 bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]', width]"
				/>
			</div>
			<OffreOfferTerms
					v-else
					:terms="terms"
					class="offre-offer-card__terms lg:my-4"
			/>

			<ul
					v-if="hasUsps"
					class="offre-offer-card__usp-list mt-2 list-disc border-t border-brand-border pt-2 pl-5 text-[length:var(--brand-text-body)] text-[color-mix(in_srgb,var(--brand-foreground)_80%,transparent)] lg:mt-0 lg:border-t-0 lg:pt-0 lg:pl-6"
			>
				<li
						v-for="usp in hotelUsps"
						:key="usp"
						class="offre-offer-card__usp-item"
				>
					{{ usp }}
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

<style scoped>
.offre-offer-card__usp-item {
  margin-bottom: 0.25rem;
}

.offre-offer-card__usp-item::marker {
  color: var(--colorPrimary, var(--brand-primary));
}
</style>
