const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

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
