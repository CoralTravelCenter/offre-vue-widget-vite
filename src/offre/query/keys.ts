import type { B2CPriceSearchCriterias } from "offre/api/types";
import { stableStringify } from "shared/lib/stable-stringify";

export const offreQueryKeys = {
  departures() {
    return ["offre", "departures"] as const;
  },
  hotelOffer(searchCriterias: B2CPriceSearchCriterias) {
    return [
      "offre",
      "hotel-offer",
      stableStringify(searchCriterias)
    ] as const;
  },
  hotelsInfo(hotelIds: Array<number | string>) {
    return ["offre", "hotels-info", hotelIds] as const;
  },
  productsBatch(searchCriteriasList: B2CPriceSearchCriterias[]) {
    return [
      "offre",
      "products-batch",
      stableStringify(searchCriteriasList)
    ] as const;
  }
};
