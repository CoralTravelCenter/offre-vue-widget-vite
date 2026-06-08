import { nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useOffreMapLocation } from "@/offre/composables/useOffreMapLocation";

const getLocationFromBoundsMock = vi.hoisted(() => vi.fn(async () => ({
  center: [30, 40] as [number, number],
  zoom: 9
})));

vi.mock("vue-yandex-maps", () => ({
  getBoundsFromCoords: vi.fn((coords: Array<[number, number]>) => coords),
  getLocationFromBounds: getLocationFromBoundsMock
}));

describe("useOffreMapLocation", () => {
  it("auto-fits once ymaps becomes initialized", async () => {
    const ymapsInitialized = ref(false);
    const setLocation = vi.fn();
    const map = ref({ setLocation });
    const points = ref([
      { hotelId: "101", longitude: 10, latitude: 20 },
      { hotelId: "202", longitude: 30, latitude: 40 }
    ]);
    const activeHotelId = ref<string | null>(null);
    const lastAutoLocationKey = ref("");
    const mapSettings = {
      location: {
        center: [0, 0] as [number, number],
        zoom: 1
      }
    };

    useOffreMapLocation({
      ymapsInitialized,
      map,
      points,
      activeHotelId,
      lastAutoLocationKeySource: lastAutoLocationKey,
      mapSettings
    });

    await nextTick();
    expect(setLocation).not.toHaveBeenCalled();

    ymapsInitialized.value = true;
    await nextTick();
    await Promise.resolve();

    expect(getLocationFromBoundsMock).toHaveBeenCalled();
    expect(setLocation).toHaveBeenCalled();
    expect(lastAutoLocationKey.value).toContain("bounds:");
  });

  it("re-applies auto-location when active hotel selection is cleared", async () => {
    const ymapsInitialized = ref(true);
    const setLocation = vi.fn();
    const map = ref({ setLocation });
    const points = ref([
      { hotelId: "101", longitude: 10, latitude: 20 },
      { hotelId: "202", longitude: 30, latitude: 40 }
    ]);
    const activeHotelId = ref<string | null>("101");
    const lastAutoLocationKey = ref("");
    const mapSettings = {
      location: {
        center: [0, 0] as [number, number],
        zoom: 1
      }
    };

    useOffreMapLocation({
      ymapsInitialized,
      map,
      points,
      activeHotelId,
      lastAutoLocationKeySource: lastAutoLocationKey,
      mapSettings
    });

    await nextTick();
    expect(setLocation).not.toHaveBeenCalled();

    activeHotelId.value = null;
    await nextTick();
    await Promise.resolve();

    expect(getLocationFromBoundsMock).toHaveBeenCalled();
    expect(setLocation).toHaveBeenCalled();
  });

  it("centers the live map for a single visible point", async () => {
    const ymapsInitialized = ref(true);
    const setLocation = vi.fn();
    const map = ref({ setLocation });
    const points = ref([
      { hotelId: "101", longitude: 10, latitude: 20 }
    ]);
    const activeHotelId = ref<string | null>(null);
    const lastAutoLocationKey = ref("");
    const mapSettings = {
      location: {
        center: [0, 0] as [number, number],
        zoom: 1
      }
    };

    useOffreMapLocation({
      ymapsInitialized,
      map,
      points,
      activeHotelId,
      lastAutoLocationKeySource: lastAutoLocationKey,
      mapSettings
    });

    await nextTick();

    expect(setLocation).toHaveBeenCalledWith({
      center: [10, 20],
      zoom: 10,
      duration: 750
    });
    expect(lastAutoLocationKey.value).toBe("single:101");
  });

  it("resets the auto-location key when no points remain", async () => {
    const ymapsInitialized = ref(true);
    const setLocation = vi.fn();
    const map = ref({ setLocation });
    const points = ref([
      { hotelId: "101", longitude: 10, latitude: 20 }
    ]);
    const activeHotelId = ref<string | null>(null);
    const lastAutoLocationKey = ref("");
    const mapSettings = {
      location: {
        center: [0, 0] as [number, number],
        zoom: 1
      }
    };

    useOffreMapLocation({
      ymapsInitialized,
      map,
      points,
      activeHotelId,
      lastAutoLocationKeySource: lastAutoLocationKey,
      mapSettings
    });

    await nextTick();
    expect(lastAutoLocationKey.value).toBe("single:101");

    points.value = [];
    await nextTick();

    expect(lastAutoLocationKey.value).toBe("");
  });
});
