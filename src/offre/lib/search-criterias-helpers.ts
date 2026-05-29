import type {
  B2CAdditionalFilter,
  B2CArrivalLocationCriteria,
  B2CHotelInfo
} from "@/offre/api";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

export function createArrivalLocationKey(location: B2CArrivalLocationCriteria) {
  return `${location.type}:${location.id}`;
}

export function buildAdditionalFilters(options: NormalizedOffreWidgetOptions): B2CAdditionalFilter[] {
  const maxPrice = Number(options.maxPrice);

  if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
    return [];
  }

  return [{
    type: 15,
    values: [{ id: "", value: `0-${maxPrice.toFixed(0)}` }],
    providers: []
  }];
}

export function toArrivalLocationCriteria(hotelInfo: B2CHotelInfo): B2CArrivalLocationCriteria | null {
  if (!hotelInfo.location?.id || !hotelInfo.location.type) {
    return null;
  }

  return {
    id: hotelInfo.location.id,
    type: hotelInfo.location.type
  };
}
