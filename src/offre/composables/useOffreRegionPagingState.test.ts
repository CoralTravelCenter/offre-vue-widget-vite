import { nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useOffreRegionPagingState } from "@/offre/composables/useOffreRegionPagingState";

describe("useOffreRegionPagingState", () => {
  it("starts a new region from page one and restores the remembered page when switching back", async () => {
    const activeRegionId = ref("turkey");
    const resetSignal = ref(0);
    const paging = useOffreRegionPagingState({
      activeRegionIdSource: activeRegionId,
      resetSignalSource: resetSignal
    });

    paging.currentPage.value = 3;
    await nextTick();

    activeRegionId.value = "egypt";
    await nextTick();
    expect(paging.currentPage.value).toBe(1);

    paging.currentPage.value = 2;
    await nextTick();

    activeRegionId.value = "turkey";
    await nextTick();
    expect(paging.currentPage.value).toBe(3);
  });

  it("resets remembered paging when the reset signal changes", async () => {
    const activeRegionId = ref("turkey");
    const resetSignal = ref(0);
    const paging = useOffreRegionPagingState({
      activeRegionIdSource: activeRegionId,
      resetSignalSource: resetSignal
    });

    paging.currentPage.value = 4;
    await nextTick();

    resetSignal.value += 1;
    await nextTick();

    expect(paging.currentPage.value).toBe(1);
  });
});
