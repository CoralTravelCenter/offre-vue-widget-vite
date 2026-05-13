<script setup lang="ts">
import {computed} from "vue";
import mapMarkerDefault from "../icons/map-marker-default.svg";
import mapMarkerElite from "../icons/map-marker-elite.svg";
import mapMarkerFamily from "../icons/map-marker-family.svg";
import {Skeleton} from "@/components/ui/skeleton";

interface Props {
	hotelId: string;
	priceLabel?: string;
	isFamilyClub?: boolean;
	isEliteHotel?: boolean;
	isOpen?: boolean;
	isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	hotelId: "",
	priceLabel: "",
	isFamilyClub: false,
	isEliteHotel: false,
	isOpen: false,
	isLoading: false
});

const markerIconSrc = computed(() => {
	if (props.isFamilyClub) {
		return mapMarkerFamily;
	}

	if (props.isEliteHotel) {
		return mapMarkerElite;
	}

	return mapMarkerDefault;
});

const hasPriceLabel = computed(() => Boolean(props.priceLabel && !props.isOpen && !props.isLoading));
const showPriceSkeleton = computed(() => Boolean(!props.isOpen && props.isLoading));
</script>

<template>
	<div
		:data-map-hotel-id="hotelId"
		class="offre-map-marker"
	>
		<img
			:src="markerIconSrc"
			alt=""
			class="offre-map-marker__icon"
		>

		<div
			v-if="hasPriceLabel"
			class="offre-map-marker__label"
		>
			{{ priceLabel }}
		</div>

		<Skeleton
			v-else-if="showPriceSkeleton"
			class="offre-map-marker__skeleton"
		/>
	</div>
</template>

<style scoped src="./OffreMapMarker.scss" lang="scss"></style>
