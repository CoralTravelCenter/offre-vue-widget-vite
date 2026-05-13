import { experimental_createQueryPersister, type AsyncStorage } from "@tanstack/query-persist-client-core";
import type { B2CPriceSearchCriterias } from "@/offre/api";
import { stableStringify } from "@/lib/stable-stringify";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const OFFRE_QUERY_PERSISTENCE_BUSTER = "offre-widget-v1";

export const offreQueryConfig = {
  hotelsInfo: {
    staleTime: 15 * MINUTE,
    gcTime: HOUR,
    persistMaxAge: HOUR
  },
  departures: {
    staleTime: 30 * MINUTE,
    gcTime: HOUR,
    persistMaxAge: HOUR
  },
  hotelOffer: {
    staleTime: 10 * MINUTE,
    gcTime: 30 * MINUTE,
    persistMaxAge: 30 * MINUTE
  },
  productsBatch: {
    staleTime: 10 * MINUTE,
    gcTime: 30 * MINUTE,
    persistMaxAge: 30 * MINUTE
  }
} as const;

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

function canUseSessionStorage() {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

function createSessionStorageAdapter(): AsyncStorage<string> | undefined {
  if (!canUseSessionStorage()) {
    return undefined;
  }

  const storage = window.sessionStorage;

  return {
    getItem(key) {
      return storage.getItem(key);
    },
    setItem(key, value) {
      storage.setItem(key, value);
    },
    removeItem(key) {
      storage.removeItem(key);
    },
    entries() {
      return Object.keys(storage).map((key) => [key, storage.getItem(key) ?? ""] as [string, string]);
    }
  };
}

function createOffreQueryPersister(prefix: string, maxAge: number) {
  return experimental_createQueryPersister({
    storage: createSessionStorageAdapter(),
    buster: OFFRE_QUERY_PERSISTENCE_BUSTER,
    maxAge,
    prefix: `offre-widget:${prefix}`,
    refetchOnRestore: true
  });
}

export const offreQueryPersisters = {
  hotelsInfo: createOffreQueryPersister("hotels-info", offreQueryConfig.hotelsInfo.persistMaxAge),
  departures: createOffreQueryPersister("departures", offreQueryConfig.departures.persistMaxAge),
  hotelOffer: createOffreQueryPersister("hotel-offer", offreQueryConfig.hotelOffer.persistMaxAge),
  productsBatch: createOffreQueryPersister("products-batch", offreQueryConfig.productsBatch.persistMaxAge)
} as const;

export async function gcOffreQueryPersisters() {
  await Promise.all([
    offreQueryPersisters.hotelsInfo.persisterGc(),
    offreQueryPersisters.departures.persisterGc(),
    offreQueryPersisters.hotelOffer.persisterGc(),
    offreQueryPersisters.productsBatch.persisterGc()
  ]);
}
