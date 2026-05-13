<script setup lang="ts">
import {Skeleton} from "@/components/ui/skeleton";
</script>

<template>
	<section
		aria-hidden="true"
		class="offre-map-view-skeleton"
	>
		<div class="offre-map-view-skeleton__canvas">
			<div class="offre-map-view-skeleton__backdrop">
				<div class="offre-map-view-skeleton__backdrop-pattern"/>

				<Skeleton class="offre-map-view-skeleton__marker offre-map-view-skeleton__marker--one"/>
				<Skeleton class="offre-map-view-skeleton__marker offre-map-view-skeleton__marker--two"/>
				<Skeleton class="offre-map-view-skeleton__marker offre-map-view-skeleton__marker--three"/>
			</div>

			<div class="offre-map-view-skeleton__sidebar">
				<div class="offre-map-view-skeleton__sidebar-header">
					<Skeleton class="offre-map-view-skeleton__sidebar-title"/>
					<Skeleton class="offre-map-view-skeleton__sidebar-tabs"/>
				</div>

				<Skeleton class="offre-map-view-skeleton__sidebar-search"/>

				<div class="offre-map-view-skeleton__sidebar-list">
					<div
						v-for="index in 4"
						:key="index"
						class="offre-map-view-skeleton__sidebar-item"
					>
						<Skeleton class="offre-map-view-skeleton__sidebar-item-media"/>
						<div class="offre-map-view-skeleton__sidebar-item-body">
							<Skeleton class="offre-map-view-skeleton__sidebar-item-line offre-map-view-skeleton__sidebar-item-line--title"/>
							<Skeleton class="offre-map-view-skeleton__sidebar-item-line offre-map-view-skeleton__sidebar-item-line--meta"/>
							<Skeleton class="offre-map-view-skeleton__sidebar-item-line offre-map-view-skeleton__sidebar-item-line--price"/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped src="./OffreMapViewSkeleton.scss" lang="scss"></style>
