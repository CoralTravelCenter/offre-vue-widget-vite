import type { WidgetHotelEntry } from "@/widget/types";
import type {
  NormalizedOffreWidgetOptions,
  NormalizedWidgetHotelDescriptor,
  NormalizedWidgetPayload
} from "@/offre/lib/payload-types";
import { normalizeNights, normalizeTimeframe, normalizeWidgetOptions } from "@/offre/lib/payload-options";
import { getWidgetHotelId } from "@/offre/lib/payload-utils";
import type { WidgetPayload } from "@/widget/types";

export function normalizeWidgetHotelDescriptor(
  hotelEntry: WidgetHotelEntry,
  options: NormalizedOffreWidgetOptions
): NormalizedWidgetHotelDescriptor | null {
  const hotelId = getWidgetHotelId(hotelEntry);

  if (hotelId === null || hotelId === undefined || hotelId === "") {
    return null;
  }

  if (typeof hotelEntry === "number" || typeof hotelEntry === "string") {
    return {
      id: hotelId,
      onlyhotel: false,
      usps: []
    };
  }

  const {
    roomCriterias: _ignoredRoomCriterias,
    ...hotelEntryRest
  } = hotelEntry;

  return {
    ...hotelEntryRest,
    id: hotelId,
    onlyhotel: Boolean(hotelEntry.onlyhotel),
    timeframe: hotelEntry.timeframe ? normalizeTimeframe(hotelEntry.timeframe) : undefined,
    nights: hotelEntry.nights ? normalizeNights(hotelEntry.nights, options.nights) : undefined,
    usps: Array.isArray(hotelEntry.usps)
      ? hotelEntry.usps.filter((entry): entry is string => typeof entry === "string")
      : []
  };
}

export function normalizeWidgetHotels(
  hotelsList: WidgetHotelEntry[] | undefined,
  options: NormalizedOffreWidgetOptions
) {
  return (Array.isArray(hotelsList) ? hotelsList : [])
    .map((hotelEntry) => normalizeWidgetHotelDescriptor(hotelEntry, options))
    .filter((hotelEntry): hotelEntry is NormalizedWidgetHotelDescriptor => hotelEntry !== null);
}

export function normalizeRuntimeWidgetPayload(payload: WidgetPayload | undefined): NormalizedWidgetPayload {
  const brand = typeof payload?.brand === "string" && payload.brand.trim()
    ? payload.brand.trim()
    : undefined;
  const options = normalizeWidgetOptions(payload?.options);
  const hotels = normalizeWidgetHotels(payload?.hotels, options);

  return {
    brand,
    options,
    hotels
  };
}
