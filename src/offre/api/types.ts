import type { OffreRequestState } from "offre/types";

export interface B2CApiMeta {
  responseDateTime?: string;
  elapsedTime?: string;
  statusCode?: number;
  correlation?: string;
}

export interface B2CApiResponse<TResult> {
  result: TResult;
  meta?: B2CApiMeta;
}

export interface B2CLocation {
  id: string;
  type: number;
  name: string;
  friendlyUrl?: string;
  isCurrent?: boolean;
}

export interface B2CLocationName {
  name: string;
}

export type B2CLocationDirectory = Record<string, B2CLocationName>;

export interface B2CHotelLocationParent {
  id: string;
  type: number;
  name: string;
  countryId?: string;
}

export interface B2CHotelLocation extends B2CLocation {
  parent?: B2CHotelLocationParent;
}

export interface B2CHotelInfo {
  id: string | number;
  name?: string;
  countryKey?: string;
  regionKey?: string;
  areaKey?: string;
  placeKey?: string;
  location?: B2CHotelLocation;
  friendlyUrl?: string;
}

export interface B2CHotelsInfoResult {
  hotels: B2CHotelInfo[];
  countries: B2CLocationDirectory;
  regions: B2CLocationDirectory;
  areas: B2CLocationDirectory;
  places: B2CLocationDirectory;
}

export interface B2CListDepartureLocationsResult {
  locations: B2CLocation[];
}

export interface B2CPassenger {
  passengerType: number;
  age: number;
}

export interface B2CRoomCriteria {
  passengers: B2CPassenger[];
}

export interface B2CNightCriteria {
  value: number;
}

export interface B2CArrivalLocationCriteria {
  id: string;
  type: number;
}

export interface B2CAdditionalFilterValue {
  id: string;
  value: string;
}

export interface B2CAdditionalFilter {
  type: number;
  values: B2CAdditionalFilterValue[];
  providers: string[];
}

export interface B2CPagingCriteria {
  pageNumber: number;
  pageSize: number;
  sortType: number;
}

export interface B2CPackageSearchCriterias {
  datePickerMode: number;
  roomCriterias: B2CRoomCriteria[];
  reservationType: 1;
  imageSizes: number[];
  beginDates: [string, string];
  nights: B2CNightCriteria[];
  departureLocations: B2CLocation[];
  arrivalLocations: B2CArrivalLocationCriteria[];
  paging: B2CPagingCriteria;
  flightType: 0 | 2;
  additionalFilters: B2CAdditionalFilter[];
}

export interface B2CHotelSearchCriterias {
  reservationType: 2;
  roomCriterias: B2CRoomCriteria[];
  paging: B2CPagingCriteria;
  beginDates: [string, string];
  nights: B2CNightCriteria[];
  arrivalLocations: B2CArrivalLocationCriteria[];
  additionalFilters: B2CAdditionalFilter[];
}

export type B2CPriceSearchCriterias = B2CPackageSearchCriterias | B2CHotelSearchCriterias;

export interface B2COfferPrice {
  amount?: number | string;
  oldAmount?: number | string;
  currency?: string;
  discountPercent?: number | string;
}

export interface B2COfferLink {
  redirectionUrl?: string;
  queryParam?: string;
}

export interface B2COfferRoomPassenger {
  age?: number;
  passengerType?: number;
}

export interface B2COfferRoom {
  passengers?: B2COfferRoomPassenger[];
  mealKey?: string | number;
  roomKey?: string | number;
  accommodationKey?: string | number;
}

export interface B2COfferFlight {
  flightDate?: string;
}

export interface B2COffer {
  price?: B2COfferPrice;
  link?: B2COfferLink;
  checkInDate?: string;
  stayNights?: number;
  flight?: B2COfferFlight;
  rooms?: B2COfferRoom[];
}

export interface B2CHotelImageSize {
  type?: number;
  url?: string;
}

export interface B2CHotelImage {
  sizes?: B2CHotelImageSize[];
}

export interface B2CHotelCoordinates {
  latitude?: number | string;
  longitude?: number | string;
}

export interface B2CProductHotel {
  id?: number | string;
  name?: string;
  locationSummary?: string;
  categoryKey?: string | number;
  recommended?: boolean;
  exclusive?: boolean;
  eliteHotel?: boolean;
  sunFamilyClub?: boolean;
  coralFamilyClub?: boolean;
  images?: B2CHotelImage[];
  coordinates?: B2CHotelCoordinates | null;
  location?: B2CHotelLocation;
}

export interface B2CProduct {
  hotel?: B2CProductHotel;
  offers?: B2COffer[];
}

export interface B2CReferenceValue {
  name?: string;
}

export interface B2CHotelCategoryReference extends B2CReferenceValue {
  starCount?: number;
}

export interface B2CPriceSearchReference {
  hotelCategories?: Record<string, B2CHotelCategoryReference>;
  meals?: Record<string, B2CReferenceValue>;
  [key: string]: unknown;
}

export interface B2CPriceSearchResult {
  products?: B2CProduct[];
  topProducts?: B2CProduct[];
  filter?: Record<string, unknown>;
  availableSortTypes?: unknown[];
  searchCriterias?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OffreProductsBatchPayload {
  products: B2CProduct[];
  reference: B2CPriceSearchReference;
}

export interface OffreProductsBatchMeta {
  requestState: OffreRequestState;
  failedQueries: number;
  queryCount: number;
}

export interface OffreProductsBatchResult {
  payload: OffreProductsBatchPayload;
  meta: OffreProductsBatchMeta;
}
