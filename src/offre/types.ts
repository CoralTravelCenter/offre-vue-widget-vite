export type OffreRequestState = "idle" | "loading" | "success" | "partial" | "error";

export interface OffreControlOption {
  value: string;
  label: string;
}

export interface RegionTabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface OffreRegionOption {
  id: string;
  label: string;
  wildcard?: boolean;
}

export interface OffreDepartureOption {
  id: string;
  type: number;
  label: string;
  friendlyUrl?: string;
  isCurrent?: boolean;
}

export interface OffreSearchFields {
  beginDates: [string, string];
  nights: number[];
}

export interface OffreHotelRuntimeTimeframe {
  key: string;
  searchFields: OffreSearchFields;
}

export interface OffreHotelRuntimeEntry {
  id: number | string;
  onlyhotel: boolean;
  usps: string[];
  timeframes: OffreHotelRuntimeTimeframe[];
}

export type OffreViewMode = "list" | "map";
export type OffreTourType = "package" | "hotel";

export type OffreOfferCardTermIcon = "flight" | "calendar" | "bed" | "meal";

export interface OffreOfferCardTerm {
  key: string;
  icon: OffreOfferCardTermIcon;
  value: string;
}
