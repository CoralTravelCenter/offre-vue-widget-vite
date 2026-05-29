export type {
  NormalizedOffreWidgetOptions,
  NormalizedWidgetHotelDescriptor,
  NormalizedWidgetPayload
} from "@/offre/lib/payload-types";
export { sanitizeWidgetPayload } from "@/offre/lib/payload-sanitize";
export { normalizeNights, normalizeTimeframe, normalizeWidgetOptions } from "@/offre/lib/payload-options";
export {
  getWidgetHotelId,
  getWidgetHotelIds
} from "@/offre/lib/payload-utils";
export {
  normalizeRuntimeWidgetPayload,
  normalizeWidgetHotelDescriptor,
  normalizeWidgetHotels
} from "@/offre/lib/payload-hotels";
