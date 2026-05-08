<script setup lang="ts">
import {StarIcon} from "lucide-vue-next";
import OffreOfferTerms from "offre/components/results/OffreOfferTerms.vue";
import type {OffreMapOverlayModel} from "offre/components/results/offre-map.types";
import {Button} from "ui/button";

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
		"offre-map-overlay-card pointer-events-auto grid rounded-[12px] border border-brand-border bg-brand-card p-1.5 shadow-brand-popover",
		mobile
			? "offre-map-overlay-card--mobile relative w-[min(360px,100%)] max-w-[calc(100%-16px)]"
			: "offre-map-overlay-card--desktop w-max max-w-[calc(100vw-32px)]"
	];
}

function getContentClass(mobile: boolean) {
	return [
		"offre-map-overlay-card__content grid gap-[10px]",
		mobile
			? "offre-map-overlay-card__content--mobile grid-cols-[112px_minmax(0,1fr)]"
			: "offre-map-overlay-card__content--desktop grid-cols-[112px_minmax(220px,1fr)]"
	];
}

function getFooterClass(mobile: boolean) {
	return [
		"offre-map-overlay-card__footer grid gap-2",
		mobile
			? "offre-map-overlay-card__footer--mobile grid-cols-[minmax(0,1fr)]"
			: "offre-map-overlay-card__footer--desktop items-center grid-cols-[minmax(0,1fr)_auto]"
	];
}

function getActionClass(mobile: boolean) {
	return mobile
		? "offre-map-overlay-card__action offre-map-overlay-card__action--mobile h-[34px] w-full rounded-[8px] px-[14px] text-[13px]"
		: "offre-map-overlay-card__action offre-map-overlay-card__action--desktop h-[34px] min-w-24 rounded-[8px] px-[14px] text-[13px]";
}
</script>

<template>
		<div
				:class="getRootClass(props.mobile)"
		>
		<button
				type="button"
				class="offre-map-overlay-card__close absolute right-2 top-2 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[6px] border border-brand-control-border bg-brand-card p-0 text-[14px]"
				aria-label="Закрыть"
				@click.stop="emit('close')"
		>
			×
		</button>

			<div
					:class="getContentClass(props.mobile)">
			<div
					v-if="model.point.imageUrl"
					class="offre-map-overlay-card__media overflow-hidden rounded-[10px]"
			>
				<img
						:src="model.point.imageUrl"
						:alt="model.point.hotelName"
						class="offre-map-overlay-card__image block h-full w-full object-cover"
				>
			</div>

			<div class="offre-map-overlay-card__body grid min-w-0 gap-1.5">
				<div
						v-if="model.starItems.length"
						class="offre-map-overlay-card__stars flex gap-0.5 leading-none text-brand-star"
				>
					<StarIcon
							v-for="(isFilled, index) in model.starItems"
							:key="`overlay-star-${index}`"
							:class="isFilled ? 'h-4 w-4 fill-current text-brand-star' : 'h-4 w-4 text-brand-border'"
					/>
				</div>

				<div class="offre-map-overlay-card__title pr-5 text-[14px] font-semibold leading-[1.2] text-brand-foreground">
					{{ model.point.hotelName }}
				</div>

				<OffreOfferTerms
						v-if="model.terms.length"
						:terms="model.terms"
				/>

					<div
							:class="getFooterClass(props.mobile)">
					<div class="offre-map-overlay-card__pricing grid min-w-0 gap-0">
						<div
								v-if="model.point.currentPriceLabel"
								class="offre-map-overlay-card__price text-[18px] font-semibold leading-[22px] text-brand-primary"
						>
							{{ model.point.currentPriceLabel }}
						</div>
						<div
								v-if="model.point.currentPriceLabel && model.point.priceSuffix"
								class="offre-map-overlay-card__price-suffix text-[12px] leading-4 text-brand-primary"
						>
							{{ model.point.priceSuffix }}
						</div>
					</div>

						<Button
								v-if="model.point.offerHref && model.point.offerHref !== '#'"
								as="a"
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
