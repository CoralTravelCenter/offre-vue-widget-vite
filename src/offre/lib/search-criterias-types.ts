import type {
  B2CArrivalLocationCriteria,
  B2CPriceSearchCriterias
} from "@/offre/api";

export interface OffreProductQueryDescriptor {
  hotels: Array<{
    hotelId: string;
    arrivalLocation: B2CArrivalLocationCriteria;
  }>;
  onlyhotel: boolean;
  searchCriterias: B2CPriceSearchCriterias;
}
