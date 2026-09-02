import { expect, test, type Page } from "@playwright/test";

const IMAGE_DATA_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='576' height='522'%3E%3Crect width='576' height='522' fill='%23dbeafe'/%3E%3C/svg%3E";

function apiResponse(result: Record<string, unknown>) {
  return {
    meta: {
      statusCode: 200,
      elapsedTime: "00:00:00.001"
    },
    result
  };
}

async function mockB2CApi(page: Page) {
  await page.route("**/endpoints/HotelContent/ListHotelsInfo", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: apiResponse({
        countries: {
          tr: { name: "Турция" }
        },
        regions: {},
        areas: {},
        places: {},
        hotels: [{
          id: "101",
          name: "Smoke Test Hotel",
          countryKey: "tr",
          categoryKey: "five-stars",
          location: {
            id: "101-7",
            type: 7
          }
        }]
      })
    });
  });

  await page.route("**/endpoints/PackageTourHotelProduct/ListDepartureLocations", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: apiResponse({
        locations: [{
          id: "2671-5",
          type: 5,
          name: "Москва",
          friendlyUrl: "moskva",
          isCurrent: true
        }]
      })
    });
  });

  await page.route("**/endpoints/PackageTourHotelProduct/PriceSearchList", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: apiResponse({
        products: [{
          hotel: {
            id: "101",
            name: "Smoke Test Hotel",
            countryKey: "tr",
            categoryKey: "five-stars",
            locationSummary: "Белек, Турция",
            images: [{
              sizes: [{ type: 4, url: IMAGE_DATA_URL }]
            }]
          },
          offers: [{
            price: { amount: 125000 },
            stayNights: 7,
            checkInDate: "2026-09-18T00:00:00+03:00",
            rooms: [{
              passengers: [
                { age: 20, passengerType: 0 },
                { age: 20, passengerType: 0 }
              ]
            }],
            link: {
              redirectionUrl: "/hotels/smoke-test-hotel",
              queryParam: "offer=smoke"
            }
          }]
        }],
        hotelCategories: {
          "five-stars": { name: "5 звезд", starCount: 5 }
        }
      })
    });
  });

  await page.route("**/endpoints/OnlyHotelProduct/PriceSearchList", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: apiResponse({ products: [] })
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockB2CApi(page);
});

test("renders the first card within the frontend budget", async ({ page }) => {
  await page.goto("/smoke/?offreDebug=1");

  await expect(page.getByText("Smoke Test Hotel", { exact: true })).toBeVisible();
  await expect(page.getByText("125 000 ₽", { exact: true })).toBeVisible();

  await expect.poll(async () => {
    return page.evaluate(() => {
      return performance.getEntriesByType("mark").map((entry) => entry.name);
    });
  }).toEqual(expect.arrayContaining([
    "offre:mounted",
    "offre:visible",
    "offre:bootstrap-ready",
    "offre:products-request-start",
    "offre:products-request-end",
    "offre:first-card-rendered",
    "offre:first-image-loaded"
  ]));

  const frontendOverheadMs = await page.evaluate(() => {
    const requestEnd = performance.getEntriesByName("offre:products-request-end").at(-1)?.startTime ?? 0;
    const firstCard = performance.getEntriesByName("offre:first-card-rendered").at(-1)?.startTime ?? 0;
    return firstCard - requestEnd;
  });

  expect(frontendOverheadMs).toBeGreaterThanOrEqual(0);
  expect(frontendOverheadMs).toBeLessThan(100);
});

test("prepares bootstrap before starting the viewport-gated price search", async ({ page }) => {
  await page.goto("/smoke/?below=1");

  await expect.poll(async () => {
    return page.evaluate(() => performance.getEntriesByName("offre:bootstrap-ready").length);
  }).toBe(1);

  expect(await page.evaluate(() => performance.getEntriesByName("offre:products-request-start").length)).toBe(0);

  await page.locator("#widget-shell").scrollIntoViewIfNeeded();
  await expect(page.getByText("Smoke Test Hotel", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => performance.getEntriesByName("offre:products-request-start").length)).toBe(1);
});

test("supports repeated bootstrap and unmount/remount", async ({ page }) => {
  await page.goto("/smoke/");
  await expect(page.locator("[data-offre-widget-root='true']")).toHaveCount(1);

  const lifecycle = await page.evaluate(() => {
    const script = document.querySelector<HTMLScriptElement>("script[data-offre-vue-test]");
    if (!script || !window.OffreWidget) {
      throw new Error("Smoke widget API is unavailable");
    }

    const firstInstanceId = script.getAttribute("data-offre-widget-instance-id");
    const repeated = window.OffreWidget.bootstrap?.()[0];
    const unmounted = window.OffreWidget.unmount?.(script);
    const remounted = window.OffreWidget.bootstrap?.()[0];

    return {
      firstInstanceId,
      repeatedInstanceId: repeated?.instanceId,
      remountedInstanceId: remounted?.instanceId,
      unmounted
    };
  });

  expect(lifecycle.unmounted).toBe(true);
  expect(lifecycle.repeatedInstanceId).toBe(lifecycle.firstInstanceId);
  expect(lifecycle.remountedInstanceId).not.toBe(lifecycle.firstInstanceId);
  await expect(page.locator("[data-offre-widget-root='true']")).toHaveCount(1);
});

test("mounts two isolated widget instances", async ({ page }) => {
  await page.goto("/smoke/");

  const instanceIds = await page.evaluate(() => {
    const script = document.createElement("script");
    script.type = "application/json";
    script.dataset.offreVueTest = "";
    script.textContent = JSON.stringify({
      brand: "sunmar",
      options: {
        groupBy: "countries",
        preferRegion: "Турция",
        departureCity: "Москва",
        nights: [7],
        timeframe: {
          fixed: ["2026-09-15", "2026-09-30"],
          monthly: false
        }
      },
      hotels: [{ id: 101 }]
    });
    document.querySelector("#widget-shell")?.append(script);
    window.OffreWidget?.mount?.(script);

    return Array.from(document.querySelectorAll("[data-offre-widget-root='true']"))
      .map((root) => root.getAttribute("data-offre-widget-instance-id"));
  });

  expect(instanceIds).toHaveLength(2);
  expect(new Set(instanceIds).size).toBe(2);
  await expect(page.locator(".offre-theme--coral")).toHaveCount(1);
  await expect(page.locator(".offre-theme--sunmar")).toHaveCount(1);

  const brandColors = await page.evaluate(() => {
    const coralHost = document.querySelector(".offre-theme--coral");
    const sunmarHost = document.querySelector(".offre-theme--sunmar");

    return {
      coral: coralHost ? getComputedStyle(coralHost).getPropertyValue("--brand-primary").trim() : "",
      sunmar: sunmarHost ? getComputedStyle(sunmarHost).getPropertyValue("--brand-primary").trim() : ""
    };
  });

  expect(brandColors).toEqual({
    coral: "#0092d0",
    sunmar: "#ff6b00"
  });
});

test("keeps select portals and theme tokens inside the widget host", async ({ page }) => {
  await page.goto("/smoke/");
  await page.evaluate(() => document.body.classList.add("dark"));

  await expect(page.locator(".offre-city-select__trigger")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.locator(".offre-city-select__trigger").click();

  const selectContent = page.locator("[data-slot='select-content']");
  await expect(selectContent).toBeVisible();

  const portalState = await selectContent.evaluate((element) => {
    const widgetHost = element.closest(".offre-widget-host");

    return {
      brand: widgetHost?.getAttribute("data-offre-brand") ?? "",
      primary: getComputedStyle(element).getPropertyValue("--brand-primary").trim(),
      background: getComputedStyle(element).backgroundColor
    };
  });

  expect(portalState).toEqual({
    brand: "coral",
    primary: "#0092d0",
    background: "rgb(255, 255, 255)"
  });
});

test("does not leak widget styles into the host page", async ({ page }) => {
  await page.goto("/smoke/");

  const styles = await page.evaluate(() => {
    const hostButton = document.querySelector("#host-button");
    if (!hostButton) {
      throw new Error("Host sentinel button is unavailable");
    }

    return {
      before: window.__offreHostStylesBeforeWidget,
      after: {
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
        buttonBorder: getComputedStyle(hostButton).border,
        buttonCursor: getComputedStyle(hostButton).cursor,
        fontSansVariable: getComputedStyle(document.documentElement).getPropertyValue("--font-sans"),
        spacingVariable: getComputedStyle(document.documentElement).getPropertyValue("--spacing")
      }
    };
  });

  expect(styles.after).toEqual(styles.before);
});

declare global {
  interface Window {
    __offreHostStylesBeforeWidget?: Record<string, string>;
  }
}
