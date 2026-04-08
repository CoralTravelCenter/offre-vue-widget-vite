<script setup lang="ts">
import {StarIcon} from "lucide-vue-next";
import OffreOfferTerms from "offre/components/results/OffreOfferTerms.vue";
import type {OffreMapOverlayModel} from "offre/components/results/offre-map.types";
import {Button} from "ui/button";

interface Props {
	model: OffreMapOverlayModel;
	mobile?: boolean;
}

withDefaults(defineProps<Props>(), {
	mobile: false
});

const emit = defineEmits<{
	close: [];
}>();
</script>

<template>
	<div
			:class="mobile
      ? 'pointer-events-auto relative grid w-[min(360px,100%)] max-w-[calc(100%-16px)] rounded-[12px] border border-[#f0f0f0] bg-white p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)]'
      : 'pointer-events-auto grid w-max max-w-[calc(100vw-32px)] rounded-[12px] border border-[#f0f0f0] bg-white p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)]'"
	>
		<button
				type="button"
				class="absolute right-2 top-2 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[6px] border border-[#d9d9d9] bg-white p-0 text-[14px]"
				aria-label="Закрыть"
				@click.stop="emit('close')"
		>
			×
		</button>

		<div
				:class="mobile ? 'grid grid-cols-[112px_minmax(0,1fr)] gap-[10px]' : 'grid grid-cols-[112px_minmax(220px,1fr)] gap-[10px]'">
			<div
					v-if="model.point.imageUrl"
					class="overflow-hidden rounded-[10px]"
			>
				<img
						:src="model.point.imageUrl"
						:alt="model.point.hotelName"
						class="block h-full w-full object-cover"
				>
			</div>

			<div class="grid min-w-0 gap-1.5">
				<div
						v-if="model.starItems.length"
						class="flex gap-0.5 leading-none text-[#fadb14]"
				>
					<StarIcon
							v-for="(isFilled, index) in model.starItems"
							:key="`overlay-star-${index}`"
							:class="isFilled ? 'h-4 w-4 fill-current text-[#fadb14]' : 'h-4 w-4 text-border'"
					/>
				</div>

				<div class="pr-5 text-[14px] font-semibold leading-[1.2] text-[#262626]">
					{{ model.point.hotelName }}
				</div>

				<OffreOfferTerms
						v-if="model.terms.length"
						:terms="model.terms"
				/>

				<div
						:class="mobile ? 'grid gap-2 grid-cols-[minmax(0,1fr)]' : 'grid items-center gap-2 grid-cols-[minmax(0,1fr)_auto]'">
					<div class="grid min-w-0 gap-0">
						<div
								v-if="model.point.currentPriceLabel"
								class="text-[18px] font-semibold leading-[22px] text-primary"
						>
							{{ model.point.currentPriceLabel }}
						</div>
						<div
								v-if="model.point.currentPriceLabel && model.point.priceSuffix"
								class="text-[12px] leading-4 text-primary"
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
							:class="mobile ? 'h-[34px] w-full rounded-[8px] px-[14px] text-[13px]' : 'h-[34px] min-w-24 rounded-[8px] px-[14px] text-[13px]'"
					>
						Выбрать
					</Button>
					<Button
							v-else
							:class="mobile ? 'h-[34px] w-full rounded-[8px] px-[14px] text-[13px]' : 'h-[34px] min-w-24 rounded-[8px] px-[14px] text-[13px]'"
							disabled
					>
						Недоступно
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>
