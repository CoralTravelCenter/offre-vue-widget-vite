import type {BrandDefinition, BrandKey} from "shared/types/brand";
import type { B2CPassenger, B2CRoomCriteria } from "offre/api/types";

export type WidgetGroupBy = "countries" | "regions" | "areas" | "places";
export type WidgetPricingMode = "default" | "per-person" | "per-night";
export type WidgetSortBy = "price" | "source";

export interface WidgetFixedTimeframeOption {
    key: string;
    frame: [string, string];
}

export interface WidgetTimeframeConfig {
    fixed?: [string, string] | WidgetFixedTimeframeOption[];
    fluid?: [string, string];
    monthly?: boolean;
}

export interface WidgetHotelDescriptor {
    id: number | string;
    onlyhotel?: boolean;
    timeframe?: WidgetTimeframeConfig;
    nights?: number | number[];
    usps?: string[];
    roomCriterias?: B2CRoomCriteria[];

    [key: string]: unknown;
}

export interface WidgetOptions {
    groupBy?: WidgetGroupBy | string;
    chartersOnly?: boolean;
    wildcardOption?: string;
    pricing?: WidgetPricingMode | string;
    timeframe?: WidgetTimeframeConfig;
    nights?: number | number[];
    regionsOrder?: string[];
    preferRegion?: string;
    maxPrice?: number | string;
    sortBy?: WidgetSortBy | string;
    departureCity?: string;
    blackList?: string[];
    passengers?: B2CPassenger;
    roomCriterias?: B2CRoomCriteria[];

    [key: string]: unknown;
}

export type WidgetHotelEntry = number | string | WidgetHotelDescriptor;

export interface WidgetPayload<TOptions extends WidgetOptions = WidgetOptions> {
    brand?: BrandKey | string;
    options?: TOptions;
    hotels?: WidgetHotelEntry[];
}

export interface OffreWidgetRootProps {
    brandKey: BrandKey;
    brandDefinition: BrandDefinition;
    options?: WidgetOptions;
    hotelsList?: WidgetHotelEntry[];
}
