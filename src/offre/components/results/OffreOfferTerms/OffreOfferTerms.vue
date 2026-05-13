<script setup lang="ts">
import type {Component} from "vue";
import AllInclusiveIcon from "@/offre/components/results/icons/AllInclusiveIcon.vue";
import DatesIcon from "@/offre/components/results/icons/DatesIcon.vue";
import FlightIcon from "@/offre/components/results/icons/FlightIcon.vue";
import NightsIcon from "@/offre/components/results/icons/NightsIcon.vue";
import type {OffreOfferCardTerm, OffreOfferCardTermIcon} from "@/offre/types";

interface Props {
	terms: OffreOfferCardTerm[];
}

defineProps<Props>();

const termIconByKey: Record<OffreOfferCardTermIcon, Component> = {
	flight: FlightIcon,
	calendar: DatesIcon,
	bed: NightsIcon,
	meal: AllInclusiveIcon
};

const termIconClassByKey: Record<OffreOfferCardTermIcon, string> = {
	flight: "offre-offer-terms__icon",
	calendar: "offre-offer-terms__icon",
	bed: "offre-offer-terms__icon",
	meal: "offre-offer-terms__icon"
};
</script>

<template>
	<ul
		v-if="terms.length"
		class="offre-offer-terms terms"
	>
		<li
			v-for="term in terms"
			:key="term.key"
			:class="['offre-offer-terms__item', term.key]"
		>
			<component
				:is="termIconByKey[term.icon]"
				:class="termIconClassByKey[term.icon]"
			/>
			<span class="offre-offer-terms__value">{{ term.value }}</span>
		</li>
	</ul>
</template>

<style scoped src="./OffreOfferTerms.scss" lang="scss"></style>
