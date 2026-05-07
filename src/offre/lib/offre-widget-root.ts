import { stableStringify } from "shared/lib/stable-stringify";

export function buildWidgetPersistenceKey(params: {
  brandKey: string;
  hotelIds: Array<number | string | null | undefined>;
  options: unknown;
  mode?: string;
}) {
  return stableStringify({
    brandKey: params.brandKey,
    hotels: params.hotelIds,
    options: params.options,
    ...(params.mode ? { mode: params.mode } : {})
  });
}

export function buildMapViewKey(params: {
  activeRegionId?: string | null;
  selectedDepartureId?: string | null;
  selectedTimeframe?: string | null;
  guestsFilterKey?: string | null;
}) {
  return [
    params.activeRegionId ?? "",
    params.selectedDepartureId ?? "",
    params.selectedTimeframe ?? "",
    params.guestsFilterKey ?? ""
  ].join("|");
}

export function shouldActivateMapView(viewMode: string) {
  return viewMode === "map";
}
