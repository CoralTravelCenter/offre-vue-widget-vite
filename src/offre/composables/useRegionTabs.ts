import { computed, nextTick, ref, watch, type Ref } from "vue";
import { useResizeObserver, useScroll } from "@vueuse/core";
import type { RegionTabItem } from "offre/types";

interface UseRegionTabsParams {
  activeRegionId: Ref<string>;
  containerRef: Ref<HTMLElement | null>;
  tabs: Ref<RegionTabItem[]>;
}

function getTabSelector(regionId: string) {
  return `[data-region-tab-id="${regionId}"]`;
}

export function useRegionTabs({ activeRegionId, containerRef, tabs }: UseRegionTabsParams) {
  const hasInitialScrollSync = ref(false);
  const { arrivedState, measure } = useScroll(containerRef, {
    behavior: "smooth"
  });

  const canScrollBackward = computed(() => !arrivedState.left);
  const canScrollForward = computed(() => !arrivedState.right);

  async function scrollToActiveRegion(
    regionId = activeRegionId.value,
    behavior: ScrollBehavior = hasInitialScrollSync.value ? "smooth" : "auto"
  ) {
    const container = containerRef.value;

    if (!container || !regionId) {
      return;
    }

    await nextTick();

    const activeTab = container.querySelector<HTMLElement>(getTabSelector(regionId));

    if (!activeTab) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const containerCenter = container.clientWidth / 2;
    const tabCenter = tabRect.left - containerRect.left + (tabRect.width / 2);
    const nextLeft = container.scrollLeft + tabCenter - containerCenter;
    const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);

    container.scrollTo({
      left: Math.min(Math.max(nextLeft, 0), maxScrollLeft),
      behavior
    });

    hasInitialScrollSync.value = true;
    measure();
  }

  function scrollViewport(direction: "backward" | "forward") {
    const container = containerRef.value;

    if (!container) {
      return;
    }

    const viewportStep = Math.max(Math.round(container.clientWidth * 0.72), 160);
    const nextLeft = direction === "forward"
      ? container.scrollLeft + viewportStep
      : container.scrollLeft - viewportStep;
    const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);

    container.scrollTo({
      left: Math.min(Math.max(nextLeft, 0), maxScrollLeft),
      behavior: "smooth"
    });

    measure();
  }

  useResizeObserver(containerRef, () => {
    measure();
  });

  watch(
    () => [activeRegionId.value, tabs.value.length] as const,
    async ([nextRegionId]) => {
      if (!nextRegionId) {
        measure();
        return;
      }

      await scrollToActiveRegion(nextRegionId);
    },
    { flush: "post", immediate: true }
  );

  return {
    canScrollBackward,
    canScrollForward,
    measure,
    scrollViewport,
    scrollToActiveRegion
  };
}
