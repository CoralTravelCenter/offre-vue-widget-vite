import type { B2CLocationDirectory } from "@/offre/api";

export const WILDCARD_REGION_ID = "*";

export type HotelLocationField = "countryKey" | "regionKey" | "areaKey" | "placeKey";

export interface RegionDirectories {
  countries: B2CLocationDirectory;
  regions: B2CLocationDirectory;
  areas: B2CLocationDirectory;
  places: B2CLocationDirectory;
}
