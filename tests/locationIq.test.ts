import assert from "node:assert/strict";
import test from "node:test";

import { formatLocationIqName, reverseGeocodeLocation, searchLocations } from "../src/services/locationIq";

test("LocationIQ city labels prefer the resolved locality over the administrative region", () => {
  assert.equal(
    formatLocationIqName({
      display_name: "Jamalpur, Jamalpur District, Mymensingh Division, Bangladesh",
      address: {
        city: "Jamalpur",
        county: "Jamalpur District",
        state: "Mymensingh Division",
        country: "Bangladesh"
      }
    }),
    "Jamalpur, Bangladesh"
  );
});

test("LocationIQ labels fall back through town and country fields", () => {
  assert.equal(
    formatLocationIqName({
      display_name: "Pithoragarh, Uttarakhand, India",
      address: { town: "Pithoragarh", state: "Uttarakhand", country: "India" }
    }),
    "Pithoragarh, India"
  );
  assert.equal(
    formatLocationIqName({ display_name: "Bangladesh", address: { country: "Bangladesh" } }),
    "Bangladesh"
  );
});

async function withResponse(value: unknown, check: () => Promise<void>) {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;
  process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(JSON.stringify(value), { status: 200 });
  try { await check(); }
  finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;
    else process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY = previousKey;
  }
}

test("unexpected search response shapes produce a readable service error", async () => {
  for (const value of [null, { error: "Service unavailable" }, "Unavailable"]) {
    await withResponse(value, async () => {
      await assert.rejects(searchLocations("London"), /Location names are temporarily unavailable/);
    });
  }
});

test("empty and malformed coordinates never become a valid zero-degree location", async () => {
  await withResponse([
    null, {}, { lat: null, lon: null }, { lat: "", lon: " " }, { lat: false, lon: true },
    { lat: "0", lon: "0", display_name: "Zero coordinates", address: { city: 10, country: 12, country_code: {} } },
    { lat: "51.5", lon: "-0.1", display_name: 5, address: { city: "London", country: "United Kingdom", country_code: "gb" } },
  ], async () => {
    const locations = await searchLocations("London");
    assert.equal(locations.length, 2);
    assert.equal(locations[0].lat, 0);
    assert.equal(locations[0].lng, 0);
    assert.equal(locations[0].name, "Zero coordinates");
    assert.equal(locations[1].name, "London, United Kingdom");
    assert.equal(locations[1].countryCode, "GB");
  });
});

test("invalid reverse lookup responses fall back instead of inventing a city name", async () => {
  for (const value of [null, [], {}, { address: { city: 4 } }]) {
    await withResponse(value, async () => {
      await assert.rejects(reverseGeocodeLocation(23.8, 90.4), /Location names are temporarily unavailable/);
    });
  }
});
