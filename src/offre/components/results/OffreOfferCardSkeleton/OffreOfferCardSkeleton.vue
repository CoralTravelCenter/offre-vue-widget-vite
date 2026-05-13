<script setup lang="ts">
import {Skeleton} from "@/components/ui/skeleton";
</script>

<template>
	<article class="offre-offer-card-skeleton" aria-hidden="true">
		<div class="offre-offer-card-skeleton__media">
			<Skeleton class="offre-offer-card-skeleton__image"/>

			<div class="offre-offer-card-skeleton__badges">
				<Skeleton class="offre-offer-card-skeleton__badge offre-offer-card-skeleton__badge--wide"/>
				<Skeleton class="offre-offer-card-skeleton__badge"/>
			</div>
		</div>

		<div class="offre-offer-card-skeleton__body">
			<Skeleton class="offre-offer-card-skeleton__location"/>
			<Skeleton class="offre-offer-card-skeleton__title offre-offer-card-skeleton__title--primary"/>
			<Skeleton class="offre-offer-card-skeleton__title offre-offer-card-skeleton__title--secondary"/>

			<div class="offre-offer-card-skeleton__stars">
				<Skeleton
					v-for="index in 5"
					:key="index"
					class="offre-offer-card-skeleton__star"
				/>
			</div>

			<div class="offre-offer-card-skeleton__terms">
				<Skeleton
					v-for="index in 4"
					:key="`term-${index}`"
					class="offre-offer-card-skeleton__term"
				/>
			</div>

			<div class="offre-offer-card-skeleton__usp-list">
				<Skeleton class="offre-offer-card-skeleton__usp offre-offer-card-skeleton__usp--wide"/>
				<Skeleton class="offre-offer-card-skeleton__usp"/>
				<Skeleton class="offre-offer-card-skeleton__usp offre-offer-card-skeleton__usp--narrow"/>
			</div>
		</div>

		<aside class="offre-offer-card-skeleton__aside">
			<div class="offre-offer-card-skeleton__tour-type">
				<Skeleton class="offre-offer-card-skeleton__tour-type-item"/>
				<Skeleton class="offre-offer-card-skeleton__tour-type-item"/>
			</div>

			<div class="offre-offer-card-skeleton__tour-info">
				<div class="offre-offer-card-skeleton__pricing">
					<Skeleton class="offre-offer-card-skeleton__caption"/>
					<Skeleton class="offre-offer-card-skeleton__old-price"/>
					<Skeleton class="offre-offer-card-skeleton__current-price"/>
					<Skeleton class="offre-offer-card-skeleton__price-note"/>
					<Skeleton class="offre-offer-card-skeleton__discount"/>
				</div>

				<Skeleton class="offre-offer-card-skeleton__cashback"/>
				<Skeleton class="offre-offer-card-skeleton__button"/>
			</div>
		</aside>
	</article>
</template>

<style scoped src="./OffreOfferCardSkeleton.scss" lang="scss"></style>
