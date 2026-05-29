import type {
  WidgetGroupBy,
  WidgetHotelDescriptor,
  WidgetOptions,
  WidgetPricingMode,
  WidgetRoomCriteria,
  WidgetSortBy,
  WidgetTheme,
  WidgetTimeframeConfig
} from "@/widget/types";
import type { BrandKey } from "@/brands/types";

export interface NormalizedOffreWidgetOptions extends Omit<WidgetOptions, "groupBy" | "pricing" | "sortBy" | "timeframe" | "nights" | "chartersOnly" | "regionsOrder"> {
  groupBy: WidgetGroupBy;
  chartersOnly: boolean;
  pricing: WidgetPricingMode;
  theme: WidgetTheme;
  timeframe: WidgetTimeframeConfig;
  nights: number[];
  regionsOrder: string[];
  sortBy: WidgetSortBy;
  roomCriterias?: WidgetRoomCriteria[];
  wildcardOption?: string;
  preferRegion?: string;
  departureCity?: string;
  maxPrice?: number | string;
}

export interface NormalizedWidgetHotelDescriptor extends Omit<WidgetHotelDescriptor, "onlyhotel" | "timeframe" | "nights" | "usps"> {
  id: number | string;
  onlyhotel: boolean;
  timeframe?: WidgetTimeframeConfig;
  nights?: number[];
  usps: string[];
}

export interface NormalizedWidgetPayload {
  brand?: BrandKey | string;
  options: NormalizedOffreWidgetOptions;
  hotels: NormalizedWidgetHotelDescriptor[];
}
