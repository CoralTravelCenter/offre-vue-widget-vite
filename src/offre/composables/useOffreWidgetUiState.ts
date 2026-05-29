import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import type {WidgetRoomCriteria} from "@/widget/types";
import {
  buildSelectedRoomCriterias,
  normalizeGuestsState,
  readPersistedGuestsState,
  resolveInitialGuestsState,
  writePersistedGuestsState,
  type OffreWidgetGuestsState
} from "@/offre/composables/useOffreWidgetUiState.helpers";

export function useOffreWidgetUiState(params: {
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  storageKeySource?: MaybeRefOrGetter<string | null | undefined>;
}) {
  const storageKey = computed(() => String(toValue(params.storageKeySource) ?? "").trim());
  const defaultGuests = computed(() => resolveInitialGuestsState(toValue(params.optionsSource).roomCriterias));
  const selectedGuests = ref(resolveInitialGuestsState(toValue(params.optionsSource).roomCriterias));

  watch(
    [storageKey, () => toValue(params.optionsSource).roomCriterias] as const,
    ([nextStorageKey, nextRoomCriterias]) => {
      selectedGuests.value = readPersistedGuestsState(nextStorageKey)
        ?? resolveInitialGuestsState(nextRoomCriterias);
    },
    { immediate: true }
  );

  watch(
    selectedGuests,
    (nextGuests) => {
      writePersistedGuestsState(storageKey.value, nextGuests);
    },
    { deep: true }
  );

  const selectedRoomCriterias = computed<WidgetRoomCriteria[]>(() => {
    return buildSelectedRoomCriterias(selectedGuests.value);
  });

  const effectiveSearchOptions = computed(() => ({
    ...toValue(params.optionsSource),
    roomCriterias: selectedRoomCriterias.value
  }));

  const guestsFilterKey = computed(() => JSON.stringify(selectedGuests.value));

  function handleGuestsApply(value: OffreWidgetGuestsState) {
    selectedGuests.value = normalizeGuestsState(value);
  }

  function handleGuestsReset() {
    selectedGuests.value = defaultGuests.value;
  }

  return {
    defaultGuests,
    selectedGuests,
    selectedRoomCriterias,
    effectiveSearchOptions,
    guestsFilterKey,
    handleGuestsApply,
    handleGuestsReset
  };
}
