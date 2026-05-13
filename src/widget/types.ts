import type {BrandKey} from "@/brands/types";

export type WidgetGroupBy = "countries" | "regions" | "areas" | "places";
export type WidgetPricingMode = "default" | "per-person" | "per-night";
export type WidgetSortBy = "price" | "source";
export type WidgetTheme = "default" | "elite" | "dark";

export interface WidgetPassenger {
    passengerType: number;
    age: number;
}

export interface WidgetRoomCriteria {
    passengers: WidgetPassenger[];
}

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

    [key: string]: unknown;
}

export interface WidgetOptions {
    groupBy?: WidgetGroupBy | string;
    chartersOnly?: boolean;
    theme?: WidgetTheme | string;
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
    passengers?: WidgetPassenger;
    roomCriterias?: WidgetRoomCriteria[];

    [key: string]: unknown;
}

export type WidgetHotelEntry = number | string | WidgetHotelDescriptor;

export interface WidgetPayload<TOptions extends WidgetOptions = WidgetOptions> {
    brand?: BrandKey | string;
    options?: TOptions;
    hotels?: WidgetHotelEntry[];
}
