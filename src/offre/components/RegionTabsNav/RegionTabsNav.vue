<script setup lang="ts">
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import RegionTabsNavSkeleton from "@/offre/components/RegionTabsNavSkeleton/RegionTabsNavSkeleton.vue";
import type {RegionTabItem} from "@/offre/types";
import {computed, nextTick, ref, watch} from "vue";

interface Props {
	tabs: RegionTabItem[];
	isLoading?: boolean;
	ariaLabel?: string;
}

const modelValue = defineModel<string>({required: true});

const props = withDefaults(defineProps<Props>(), {
	tabs: () => [],
	isLoading: false,
	ariaLabel: "Регионы"
});

const visibleTabs = computed(() => props.tabs.filter((tab) => !tab.disabled));
const availableTabIds = computed(() => visibleTabs.value.map((tab) => tab.id));

const rootRef = ref<HTMLElement | null>(null);
const scrollerRef = ref<HTMLElement | null>(null);
const hasInitialScrollSync = ref(false);

function syncScrollerElement() {
	scrollerRef.value = rootRef.value?.querySelector<HTMLElement>("[data-slot='tabs-list']") ?? null;
}

function scrollToValue(value: string, behavior: ScrollBehavior = "smooth") {
	const container = scrollerRef.value;

	if (!value || !container) {
		return;
	}

	const activeItem = Array.from(container.children).find((element) => {
		return element instanceof HTMLElement && element.dataset.regionId === value;
	});

	if (!(activeItem instanceof HTMLElement)) {
		return;
	}

	activeItem.scrollIntoView({behavior, inline: "start", block: "nearest"});
}

function getTabClass(tabId: string) {
	const isSelected = tabId === modelValue.value;

	return [
		"region-tabs-nav__item",
		isSelected ? "region-tabs-nav__item--selected selected" : "region-tabs-nav__item--default"
	];
}

watch(
	[modelValue, availableTabIds],
	async ([value, tabIds]) => {
		syncScrollerElement();

		if (!value || !tabIds.includes(value)) {
			return;
		}

		await nextTick();
		scrollToValue(value, hasInitialScrollSync.value ? "smooth" : "auto");
		hasInitialScrollSync.value = true;
	},
	{immediate: true}
);
</script>

<template>
	<RegionTabsNavSkeleton v-if="isLoading"/>
	<div v-else ref="rootRef" class="region-tabs-nav region-select">
		<Tabs
			v-model="modelValue"
			class="region-tabs-nav__tabs"
		>
			<TabsList
				:aria-label="ariaLabel"
				size="brand"
				class="region-tabs-nav__list offre-scroll-no-bar offre-scroll-snap-x"
			>
				<TabsTrigger
					v-for="tab in visibleTabs"
					:key="tab.id"
					:value="tab.id"
					:data-region-id="tab.id"
					size="brand"
					:class="getTabClass(tab.id)"
				>
					{{ tab.label }}
				</TabsTrigger>
			</TabsList>
		</Tabs>
	</div>
</template>

<style scoped src="./RegionTabsNav.scss" lang="scss"></style>
