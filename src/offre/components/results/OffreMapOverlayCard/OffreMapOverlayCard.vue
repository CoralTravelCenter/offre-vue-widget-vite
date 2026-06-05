<script setup lang="ts">
import {LoaderCircle, StarIcon} from "lucide-vue-next";
import OffreOfferTerms from "@/offre/components/results/OffreOfferTerms/OffreOfferTerms.vue";
import type {OffreMapOverlayModel} from "@/offre/lib/offre-map";
import {Button} from "@/components/ui/button";
import {Skeleton} from "@/components/ui/skeleton";

interface Props {
	model: OffreMapOverlayModel;
	mobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	mobile: false
});

const emit = defineEmits<{
	close: [];
}>();

function getRootClass(mobile: boolean) {
	return [
		"offre-map-overlay-card",
		props.model.point.isEliteHotel
			? "offre-map-overlay-card--elite"
			: "offre-map-overlay-card--default",
		mobile
			? "offre-map-overlay-card--mobile"
			: "offre-map-overlay-card--desktop"
	];
}

function getContentClass(mobile: boolean) {
	return [
		"offre-map-overlay-card__content",
		mobile
			? "offre-map-overlay-card__content--mobile"
			: "offre-map-overlay-card__content--desktop"
	];
}

function getFooterClass(mobile: boolean) {
	return [
		"offre-map-overlay-card__footer",
		mobile
			? "offre-map-overlay-card__footer--mobile"
			: "offre-map-overlay-card__footer--desktop"
	];
}

function getActionClass(mobile: boolean) {
	return [
		"offre-map-overlay-card__action",
		mobile
			? "offre-map-overlay-card__action--mobile"
			: "offre-map-overlay-card__action--desktop"
	];
}

function getStarClass(isFilled: boolean) {
	return isFilled
		? "offre-map-overlay-card__star offre-map-overlay-card__star--filled"
		: "offre-map-overlay-card__star offre-map-overlay-card__star--empty";
}
</script>

<template>
	<div :class="getRootClass(props.mobile)">
		<button
			type="button"
			class="offre-map-overlay-card__close"
			aria-label="Закрыть"
			@click.stop="emit('close')"
		>
			×
		</button>

		<div :class="getContentClass(props.mobile)">
			<div
				v-if="model.point.imageUrl"
				class="offre-map-overlay-card__media"
			>
				<img
					:src="model.point.imageUrl"
					:alt="model.point.hotelName"
					class="offre-map-overlay-card__image"
				>
			</div>

			<div class="offre-map-overlay-card__body">
				<div
					v-if="model.starItems.length"
					class="offre-map-overlay-card__stars"
				>
					<StarIcon
						v-for="(isFilled, index) in model.starItems"
						:key="`overlay-star-${index}`"
						:class="getStarClass(isFilled)"
					/>
				</div>

				<div class="offre-map-overlay-card__title">
					{{ model.point.hotelName }}
				</div>

				<OffreOfferTerms
					v-if="model.terms.length"
					:terms="model.terms"
				/>
				<div
					v-else-if="model.point.isLoadingPrice"
					class="offre-map-overlay-card__terms-skeleton"
					aria-hidden="true"
				>
					<Skeleton class="offre-map-overlay-card__terms-skeleton-item offre-map-overlay-card__terms-skeleton-item--wide"/>
					<Skeleton class="offre-map-overlay-card__terms-skeleton-item offre-map-overlay-card__terms-skeleton-item--medium"/>
					<Skeleton class="offre-map-overlay-card__terms-skeleton-item offre-map-overlay-card__terms-skeleton-item--narrow"/>
				</div>

				<div :class="getFooterClass(props.mobile)">
					<div class="offre-map-overlay-card__pricing">
						<template v-if="model.point.isLoadingPrice">
							<Skeleton class="offre-map-overlay-card__loading-price"/>
							<Skeleton class="offre-map-overlay-card__loading-price-suffix"/>
						</template>
						<div
							v-else-if="model.point.currentPriceLabel"
							class="offre-map-overlay-card__price"
						>
							{{ model.point.currentPriceLabel }}
						</div>
						<div
							v-if="model.point.currentPriceLabel && model.point.priceSuffix"
							class="offre-map-overlay-card__price-suffix"
						>
							{{ model.point.priceSuffix }}
						</div>
					</div>

					<Button
						v-if="model.point.isLoadingPrice"
						variant="outline"
						:class="getActionClass(props.mobile)"
						disabled
					>
						<LoaderCircle class="offre-map-overlay-card__action-spinner animate-spin"/>
						Загрузка...
					</Button>
					<Button
						v-else-if="model.point.offerHref && model.point.offerHref !== '#'"
						as="a"
						variant="default"
						:href="model.point.offerHref"
						target="_blank"
						rel="noopener noreferrer"
						:class="getActionClass(props.mobile)"
					>
						Выбрать
					</Button>
					<Button
						v-else
						:class="getActionClass(props.mobile)"
						disabled
					>
						Недоступно
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped src="./OffreMapOverlayCard.scss" lang="scss"></style>
