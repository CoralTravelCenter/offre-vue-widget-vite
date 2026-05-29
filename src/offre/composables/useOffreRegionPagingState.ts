import { ref, toValue, watch, type MaybeRefOrGetter } from "vue";

export function useOffreRegionPagingState(params: {
  activeRegionIdSource: MaybeRefOrGetter<string>;
  resetSignalSource?: MaybeRefOrGetter<unknown>;
}) {
  const currentPage = ref(1);
  const regionPageById = ref<Record<string, number>>({});
  const lastRegionId = ref("");

  watch(() => toValue(params.resetSignalSource), () => {
    regionPageById.value = {};
    currentPage.value = 1;
    lastRegionId.value = "";
  }, { immediate: true });

  watch(currentPage, (nextPage) => {
    const regionId = String(toValue(params.activeRegionIdSource) ?? "").trim();

    if (!regionId) {
      return;
    }

    regionPageById.value = {
      ...regionPageById.value,
      [regionId]: Math.max(1, Number(nextPage) || 1)
    };
  }, { immediate: true });

  watch(() => toValue(params.activeRegionIdSource), (nextRegionId) => {
    const regionId = String(nextRegionId ?? "").trim();
    const previousRegionId = lastRegionId.value;

    if (previousRegionId) {
      regionPageById.value = {
        ...regionPageById.value,
        [previousRegionId]: Math.max(1, Number(currentPage.value) || 1)
      };
    }

    if (!regionId) {
      currentPage.value = 1;
      lastRegionId.value = "";
      return;
    }

    currentPage.value = Math.max(1, regionPageById.value[regionId] || 1);
    lastRegionId.value = regionId;
  }, { immediate: true });

  return {
    currentPage
  };
}
