import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { buildWidgetPersistenceKey } from "@/offre/lib/offre-widget-root";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

export interface OffreWidgetSessionStateParams {
  brandKeySource: MaybeRefOrGetter<string>;
  hotelIdsSource: MaybeRefOrGetter<Array<number | string | null | undefined>>;
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  effectiveSearchOptionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  selectedDepartureIdSource: MaybeRefOrGetter<string>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  guestsFilterKeySource: MaybeRefOrGetter<string>;
}

export function useOffreWidgetSessionState(params: OffreWidgetSessionStateParams) {
  const guestsPersistenceKey = computed(() => {
    return buildWidgetPersistenceKey({
      brandKey: toValue(params.brandKeySource),
      hotelIds: toValue(params.hotelIdsSource),
      options: toValue(params.optionsSource)
    });
  });

  const viewModePersistenceKey = computed(() => {
    return buildWidgetPersistenceKey({
      brandKey: toValue(params.brandKeySource),
      hotelIds: toValue(params.hotelIdsSource),
      options: toValue(params.optionsSource),
      mode: "results-view"
    });
  });

  const productsSessionKey = computed(() => {
    return buildWidgetPersistenceKey({
      brandKey: toValue(params.brandKeySource),
      hotelIds: toValue(params.hotelIdsSource),
      options: {
        searchOptions: toValue(params.effectiveSearchOptionsSource),
        selectedDepartureId: toValue(params.selectedDepartureIdSource),
        selectedTimeframe: toValue(params.selectedTimeframeSource),
        guestsFilterKey: toValue(params.guestsFilterKeySource)
      },
      mode: "products-session"
    });
  });

  const resetNonce = ref(0);

  watch(productsSessionKey, () => {
    resetNonce.value += 1;
  }, { immediate: true });

  return {
    guestsPersistenceKey,
    viewModePersistenceKey,
    productsSessionKey,
    resetNonce
  };
}
