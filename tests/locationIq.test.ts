import assert from "node:assert/strict";
import test from "node:test";

import { formatLocationIqName } from "../src/services/locationIq";

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
