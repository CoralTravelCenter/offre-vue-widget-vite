import type { B2COffer } from "offre/api/types";
import type { OffreOfferCardTerm } from "offre/types/offer-card";

export interface OffreMapDisplayPoint {
  key: string;
  hotelId: string;
  hotelName: string;
  locationLabel: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  categoryKey?: string | number;
  isFamilyClub: boolean;
  isEliteHotel: boolean;
  effectiveOffer: B2COffer | null;
  currentPriceValue: number;
  currentPriceLabel: string;
  priceSuffix: string;
  offerHref: string;
}

export interface OffreMapOverlayModel {
  point: OffreMapDisplayPoint;
  terms: OffreOfferCardTerm[];
  starItems: boolean[];
}
