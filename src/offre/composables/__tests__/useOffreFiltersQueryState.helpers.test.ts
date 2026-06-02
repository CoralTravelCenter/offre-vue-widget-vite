import { describe, expect, it } from "vitest";
import {
  buildDepartureLocationMap,
  buildDeparturesQueryKey,
  buildDerivedDepartureOptions,
  buildDerivedRegionOptions,
  buildDerivedRegionTabs,
  buildHotelsInfoQueryKey,
  buildMatchedHotelsDirectory,
  resolveDepartureSelectionFallback,
  resolveHotelIds,
  resolveRegionSelectionFallback,
  resolveSelectedDeparture
} from "@/offre/composables/useOffreFiltersQueryState.helpers";
import { normalizeWidgetOptions } from "@/offre/lib/payload-options";

describe("useOffreFiltersQueryState helpers", () => {
  it("builds stable query keys from hotel ids and departures", () => {
    expect(buildHotelsInfoQueryKey([101, "202"])).toEqual(["offre", "hotels-info", [101, "202"]]);
    expect(buildDeparturesQueryKey()).toEqual(["offre", "departures"]);
  });

  it("resolves unique hotel ids and preferred region/departure fallbacks", () => {
    const options = normalizeWidgetOptions({
      wildcardOption: "Все направления",
      preferRegion: "египет",
      departureCity: "москва"
    });

    expect(resolveHotelIds([
      { id: 101, onlyhotel: false, usps: [] },
      { id: 101, onlyhotel: false, usps: [] },
      { id: "202", onlyhotel: true, usps: [] }
    ])).toEqual([101, "202"]);

    const regionOptions = buildDerivedRegionOptions({
      directories: {
        countries: {},
        regions: {
          eg: { name: "Египет" },
          tr: { name: "Турция" }
        },
        areas: {},
        places: {},
        hotels: [] as never
      },
      options: {
        ...options,
        groupBy: "regions"
      }
    });

    expect(resolveRegionSelectionFallback(regionOptions, options)).toBe("eg");

    const departures = buildDerivedDepartureOptions([
      { id: "2671-5", type: 5, name: "Москва", isCurrent: true }
    ]);
    expect(resolveDepartureSelectionFallback(departures, options)).toBe("2671-5");
  });

  it("builds departure maps, selected departure and region tabs", () => {
    const departures = [
      { id: "2671-5", type: 5, name: "Москва", friendlyUrl: "moskva", isCurrent: true }
    ];
    const mappedDepartures = buildDerivedDepartureOptions(departures);
    const departureMap = buildDepartureLocationMap(departures);

    expect(resolveSelectedDeparture(departureMap, "2671-5")).toMatchObject({
      id: "2671-5",
      name: "Москва"
    });
    expect(buildDerivedRegionTabs([
      { id: "eg", label: "Египет" },
      { id: "tr", label: "Турция" }
    ])).toEqual([
      { id: "eg", label: "Египет" },
      { id: "tr", label: "Турция" }
    ]);
    expect(mappedDepartures[0].label).toBe("Москва");
  });

  it("filters matched hotels by timeframe and selected region", () => {
    const matchedHotels = buildMatchedHotelsDirectory({
      hotelsDirectory: [
        {
          id: "101",
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "June",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7]
            }
          }]
        },
        {
          id: "202",
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "July",
            searchFields: {
              beginDates: ["2026-07-01", "2026-07-31"],
              nights: [7]
            }
          }]
        }
      ],
      hotelInfoById: new Map([
        ["101", { id: "101", regionKey: "eg" }],
        ["202", { id: "202", regionKey: "tr" }]
      ]),
      selectedTimeframe: "June",
      selectedRegionId: "eg",
      groupBy: "regions"
    });

    expect(matchedHotels.map((hotel) => hotel.id)).toEqual(["101"]);
  });
});
