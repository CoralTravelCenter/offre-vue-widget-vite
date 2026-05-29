import type { B2CPriceSearchCriterias } from "@/offre/api";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

export const PACKAGE_COMMON_SEARCH_CRITERIAS = {
  datePickerMode: 0,
  roomCriterias: [{
    passengers: [
      { age: 20, passengerType: 0 },
      { age: 20, passengerType: 0 }
    ]
  }],
  reservationType: 1 as const,
  imageSizes: [4, 7]
};

export const HOTEL_COMMON_SEARCH_CRITERIAS = {
  reservationType: 2 as const,
  roomCriterias: [{
    passengers: [
      { age: 20, passengerType: 0 },
      { age: 20, passengerType: 0 }
    ]
  }]
};

export function resolveRoomCriterias(
  options: NormalizedOffreWidgetOptions,
  defaultRoomCriterias: B2CPriceSearchCriterias["roomCriterias"]
) {
  return Array.isArray(options.roomCriterias) && options.roomCriterias.length > 0
    ? options.roomCriterias
    : defaultRoomCriterias;
}
