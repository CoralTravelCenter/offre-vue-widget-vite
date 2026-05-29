export type { OffreProductQueryDescriptor } from "@/offre/lib/search-criterias-types";
export {
  HOTEL_COMMON_SEARCH_CRITERIAS,
  PACKAGE_COMMON_SEARCH_CRITERIAS,
  resolveRoomCriterias
} from "@/offre/lib/search-criterias-common";
export {
  buildAdditionalFilters,
  createArrivalLocationKey,
  toArrivalLocationCriteria
} from "@/offre/lib/search-criterias-helpers";
export { buildOffreProductQueries } from "@/offre/lib/search-criterias-builder";
