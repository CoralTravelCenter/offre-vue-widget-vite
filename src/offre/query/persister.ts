import { experimental_createQueryPersister, type AsyncStorage } from "@tanstack/query-persist-client-core";
import { offreQueryConfig } from "offre/query/config";

const OFFRE_QUERY_PERSISTENCE_BUSTER = "offre-widget-v1";

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
