import type { WidgetHotelEntry, WidgetRoomCriteria } from "@/widget/types";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPassenger(value: unknown): value is { passengerType: number; age: number } {
  return isPlainObject(value)
    && typeof value.passengerType === "number"
    && Number.isFinite(value.passengerType)
    && typeof value.age === "number"
    && Number.isFinite(value.age);
}

export function normalizeRoomCriterias(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((entry): entry is { passengers: unknown[] } => {
      return isPlainObject(entry) && Array.isArray(entry.passengers);
    })
    .map((entry) => ({
      passengers: entry.passengers.filter(isPassenger).map((passenger) => ({
        passengerType: passenger.passengerType,
        age: passenger.age
      }))
    }))
    .filter((entry) => entry.passengers.length > 0);

  return normalized.length ? normalized as WidgetRoomCriteria[] : undefined;
}

export function getWidgetHotelId(hotelEntry: WidgetHotelEntry) {
  if (typeof hotelEntry === "number" || typeof hotelEntry === "string") {
    return hotelEntry;
  }

  return hotelEntry?.id;
}

export function getWidgetHotelIds<TEntry extends WidgetHotelEntry | { id: number | string }>(
  hotelsList: TEntry[] | undefined
) {
  const uniqueHotelIds = new Set<string>();

  return (Array.isArray(hotelsList) ? hotelsList : [])
    .map((hotelEntry) => getWidgetHotelId(hotelEntry as WidgetHotelEntry))
    .filter((hotelId): hotelId is number | string => hotelId !== null && hotelId !== undefined && hotelId !== "")
    .filter((hotelId) => {
      const hotelKey = `${typeof hotelId}:${String(hotelId)}`;

      if (uniqueHotelIds.has(hotelKey)) {
        return false;
      }

      uniqueHotelIds.add(hotelKey);
      return true;
    });
}
