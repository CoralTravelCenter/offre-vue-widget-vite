<script setup lang="ts">
import {useResizeObserver} from "@vueuse/core";
import {Tabs, TabsList, TabsTrigger} from "@/shared/components/ui/tabs";
import RegionTabsNavSkeleton from "offre/components/RegionTabsNavSkeleton.vue";
import type {RegionTabItem} from "offre/types";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";

interface Props {
  tabs: RegionTabItem[];
  isLoading?: boolean;
  ariaLabel?: string;
}

const modelValue = defineModel<string>({required: true});

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  isLoading: false,
  ariaLabel: "Регионы",
});

const visibleTabs = computed(() => props.tabs.filter((tab) => !tab.disabled));
const availableTabIds = computed(() => visibleTabs.value.map((tab) => tab.id));

const shellRef = ref<HTMLElement | null>(null);
const scrollerRef = ref<HTMLElement | null>(null);
const hasInitialScrollSync = ref(false);
const scrollState = ref({
  hasOverflow: false,
  canScrollRight: false
});
let scrollStateFrame: number | null = null;

const hasRightFade = computed(() => {
  return scrollState.value.hasOverflow && scrollState.value.canScrollRight;
});

function syncScrollerElement() {
  scrollerRef.value = shellRef.value?.querySelector<HTMLElement>("[data-slot='tabs-list']") ?? null;
  scheduleUpdateScrollState();
}

function updateScrollState() {
  const container = scrollerRef.value;

  if (!container) {
    scrollState.value = {
      hasOverflow: false,
      canScrollRight: false
    };
    return;
  }

  const hasOverflow = container.scrollWidth > container.clientWidth + 1;
  const canScrollRight = container.scrollLeft + container.clientWidth < container.scrollWidth - 1;

  scrollState.value = {
    hasOverflow,
    canScrollRight
  };
}

function scheduleUpdateScrollState() {
  if (scrollStateFrame !== null) {
    cancelAnimationFrame(scrollStateFrame);
  }

  scrollStateFrame = requestAnimationFrame(() => {
    scrollStateFrame = null;
    updateScrollState();
  });
}

function scrollToValue(value: string, behavior: ScrollBehavior = "smooth") {
  const container = scrollerRef.value;

  if (!value || !container) {
    scheduleUpdateScrollState();
    return;
  }

  const activeItem = Array.from(container.children).find((element) => {
    return element instanceof HTMLElement && element.dataset.regionId === value;
  });

  if (!(activeItem instanceof HTMLElement)) {
    scheduleUpdateScrollState();
    return;
  }

  activeItem.scrollIntoView({behavior, inline: "start", block: "nearest"});
  scheduleUpdateScrollState();
}

watch(
  [modelValue, availableTabIds],
  async ([value, tabIds]) => {
    syncScrollerElement();

    if (!value || !tabIds.includes(value)) {
      scheduleUpdateScrollState();
      return;
    }

    await nextTick();
    scrollToValue(value, hasInitialScrollSync.value ? "smooth" : "auto");
    hasInitialScrollSync.value = true;
    scheduleUpdateScrollState();
  },
  {immediate: true}
);

onMounted(async () => {
  await nextTick();
  syncScrollerElement();
  scheduleUpdateScrollState();
});

useResizeObserver(scrollerRef, () => {
  scheduleUpdateScrollState();
});

onBeforeUnmount(() => {
  if (scrollStateFrame !== null) {
    cancelAnimationFrame(scrollStateFrame);
  }
});
</script>

<template>
  <RegionTabsNavSkeleton v-if="isLoading"/>
  <Tabs v-else v-model="modelValue" class="region-tabs-nav">
    <div
      ref="shellRef"
      class="region-tabs-nav__shell"
      :class="{ 'region-tabs-nav__shell--fade-right': hasRightFade }"
    >
      <TabsList
        :aria-label="ariaLabel"
        @scroll="updateScrollState"
        class="region-tabs-nav__list w-full overflow-x-auto offre-scroll-snap-x offre-scroll-no-bar h-auto bg-white flex items-center justify-start"
      >
        <TabsTrigger
          v-for="tab in visibleTabs"
          :key="tab.id"
          :value="tab.id"
          :data-region-id="tab.id"
          class="region-tabs-nav__item shadow-none px-5 py-3 shrink-0 rounded-3xl text-sm border-none text-black data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
    </div>
  </Tabs>
</template>

<style scoped>
.region-tabs-nav__shell {
  position: relative;
  min-width: 0;
}

.region-tabs-nav__shell::after {
  content: "";
  position: absolute;
  inset-block: 0;
  right: 0;
  z-index: 1;
  width: 20%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease-in-out;
  background: linear-gradient(to left, #ffffff 0%, rgba(234, 243, 251, 0) 100%);
}

.region-tabs-nav__shell--fade-right::after {
  opacity: 1;
}
</style>
