<script setup lang="ts">
import {Button} from "@/components/ui/button";
import {List, MapPinned} from "lucide-vue-next";
import {computed} from "vue";
import type {OffreViewMode} from "@/offre/types";

const modelValue = defineModel<OffreViewMode>({required: true});

const isListMode = computed(() => modelValue.value === "list");

function toggleViewMode() {
	modelValue.value = modelValue.value === "list" ? "map" : "list";
}
</script>

<template>
	<Button
			type="button"
			variant="outline"
			size="brand"
			:aria-label="isListMode ? 'Переключить на карту' : 'Переключить на список'"
			:class="[
				'offre-view-mode-switch',
				isListMode ? 'offre-view-mode-switch--list' : 'offre-view-mode-switch--map'
			]"
			@click="toggleViewMode"
	>
		<MapPinned v-if="isListMode" class="offre-view-mode-switch__icon"/>
		<List v-else class="offre-view-mode-switch__icon"/>
	</Button>
</template>

<style scoped src="./ViewModeSwitch.scss" lang="scss"></style>
