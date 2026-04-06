import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { B2CRoomCriteria } from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";

export interface OffreWidgetGuestsState {
  adultsCount: number;
  childrenAges: number[];
}

function resolveInitialGuestsState(roomCriterias: B2CRoomCriteria[] | undefined): OffreWidgetGuestsState {
  const passengers = roomCriterias?.[0]?.passengers ?? [
    { age: 20, passengerType: 0 },
    { age: 20, passengerType: 0 }
  ];

  return {
    adultsCount: passengers.filter((passenger) => Number(passenger.passengerType) === 0).length || 2,
    childrenAges: passengers
      .filter((passenger) => Number(passenger.passengerType) !== 0)
      .map((passenger) => Number(passenger.age))
      .filter((age) => Number.isFinite(age))
  };
}

export function useOffreWidgetUiState(params: {
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
}) {
  const selectedGuests = ref(resolveInitialGuestsState(toValue(params.optionsSource).roomCriterias));

  watch(
    () => toValue(params.optionsSource).roomCriterias,
    (nextRoomCriterias) => {
      selectedGuests.value = resolveInitialGuestsState(nextRoomCriterias);
    },
    { immediate: true }
  );

  const selectedRoomCriterias = computed<B2CRoomCriteria[]>(() => {
    return [{
      passengers: [
        ...Array.from({ length: selectedGuests.value.adultsCount }, () => ({
          age: 20,
          passengerType: 0
        })),
        ...selectedGuests.value.childrenAges.map((age) => ({
          age,
          passengerType: 1
        }))
      ]
    }];
  });

  const effectiveSearchOptions = computed(() => ({
    ...toValue(params.optionsSource),
    roomCriterias: selectedRoomCriterias.value
  }));

  const guestsFilterKey = computed(() => JSON.stringify(selectedGuests.value));

  function handleGuestsApply(value: OffreWidgetGuestsState) {
    selectedGuests.value = {
      adultsCount: value.adultsCount,
      childrenAges: [...value.childrenAges].sort((left, right) => left - right)
    };
  }

  function handleGuestsReset() {
    selectedGuests.value = resolveInitialGuestsState(toValue(params.optionsSource).roomCriterias);
  }

  return {
    selectedGuests,
    selectedRoomCriterias,
    effectiveSearchOptions,
    guestsFilterKey,
    handleGuestsApply,
    handleGuestsReset
  };
}
