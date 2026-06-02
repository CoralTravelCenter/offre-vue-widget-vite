<script setup lang="ts">
import {MapPinIcon, StarIcon,} from "lucide-vue-next";
import {computed} from "vue";
import type {B2CPriceSearchReference, B2CProduct} from "@/offre/api";
import OffreOfferPricingPanel from "@/offre/components/results/OffreOfferPricingPanel/OffreOfferPricingPanel.vue";
import OffreOfferTerms from "@/offre/components/results/OffreOfferTerms/OffreOfferTerms.vue";
import {useOffreOfferCardState} from "@/offre/composables/useOffreOfferCardState";
import coralFamilyClubShieldUrl from "@/offre/assets/coral-family-club-shield.svg";
import type {NormalizedOffreWidgetOptions} from "@/offre/lib/payload";
import type {OffreHotelRuntimeEntry, OffreTourType} from "@/offre/types";
import type {BrandKey} from "@/brands/types";
import {Badge} from "@/components/ui/badge";
import {Skeleton} from "@/components/ui/skeleton";

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
	cashbackInfo,
	currentPriceLabel,
	discountPercent,
	hasFamilyClub,
	hasOfferHref,
	hotelCategoryName,
	hotelName,
	hotelOfferLoading,
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
	starItems,
	terms
} = useOffreOfferCardState({
	productSource: () => props.product,
	productReferenceSource: () => props.productReference,
	selectedDepartureNameSource: () => props.selectedDepartureName ?? "",
	pricingModeSource: () => props.pricingMode,
	searchOptionsSource: () => props.searchOptions,
	hotelRuntimeEntrySource: () => props.hotelRuntimeEntry ?? null,
	selectedTourTypeRef: selectedTourType,
	brandKeySource: () => props.brandKey
});

const hasLabels = computed(() => isEliteHotel.value || hasFamilyClub.value);
const hasUsps = computed(() => hotelUsps.value.length > 0);

function getTitleClass() {
	return [
		"offre-offer-card__title",
		isEliteHotel.value
			? "offre-offer-card__title--elite"
			: "offre-offer-card__title--default"
	];
}

function getBadgeClass(kind: "recommended" | "exclusive") {
	return [
		"offre-offer-card__badge",
		kind === "recommended"
			? "offre-offer-card__badge--recommended"
			: "offre-offer-card__badge--exclusive"
	];
}

function getLabelClass(kind: "elite" | "family") {
	return [
		"offre-offer-card__label",
		kind === "elite"
			? "offre-offer-card__label--elite"
			: "offre-offer-card__label--family"
	];
}

function getTermsSkeletonItemClass(width: string) {
	return [
		"offre-offer-card__terms-skeleton-item",
		`offre-offer-card__terms-skeleton-item--${width}`
	];
}
</script>

<template>
	<article class="offre-offer-card product-card">
		<div class="offre-offer-card__media visual-details">
			<a
					:href="offerHref"
					class="offre-offer-card__media-link visual"
					rel="noopener noreferrer"
					target="_blank"
			>
				<img
						v-if="imageUrl"
						:src="imageUrl"
						:alt="hotelName"
						class="offre-offer-card__image"
				>
				<div
						v-else
						class="offre-offer-card__image-placeholder"
				/>
			</a>

			<div class="offre-offer-card__badges">
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

		<div class="offre-offer-card__body details">
			<div
					v-if="locationLabel"
					class="offre-offer-card__location location"
			>
				<MapPinIcon class="offre-offer-card__location-icon"/>
				<span class="offre-offer-card__location-text truncate">{{ locationLabel }}</span>
			</div>

			<a
					:href="offerHref"
					class="offre-offer-card__title-link hotel-name"
					rel="noopener noreferrer"
					target="_blank"
			>
				<h3 :class="getTitleClass()">
					{{ hotelName }}
				</h3>
			</a>

			<div class="offre-offer-card__meta category-concept">
				<div
						v-if="hotelStarCount > 0"
						class="offre-offer-card__stars stars"
				>
					<StarIcon
							v-for="(_isFilled, index) in starItems"
							:key="`hotel-star-${index}`"
							class="offre-offer-card__star offre-offer-card__star--filled"
					/>
				</div>
				<span
						v-else-if="hotelCategoryName"
						class="offre-offer-card__category"
				>
          {{ hotelCategoryName }}
        </span>

				<div
						v-if="hasLabels"
						class="offre-offer-card__labels"
				>
					<Badge
							v-if="isEliteHotel"
							:class="getLabelClass('elite')"
					>
						ELITE SERVICE
					</Badge>

					<img
						v-if="hasFamilyClub"
						:src="coralFamilyClubShieldUrl"
						alt="Coral Family Club"
						class="offre-offer-card__family-shield"
					>
				</div>
			</div>

			<div v-if="hotelOfferLoading" class="offre-offer-card__terms-skeleton" aria-hidden="true">
				<Skeleton
						v-for="width in ['34', '28', '32', '38']"
						:key="width"
						:class="getTermsSkeletonItemClass(width)"
				/>
			</div>
			<OffreOfferTerms
					v-else
					:terms="terms"
					class="offre-offer-card__terms"
			/>

			<ul
					v-if="hasUsps"
					class="offre-offer-card__usp-list"
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

<style scoped src="./OffreOfferCard.scss" lang="scss"></style>
