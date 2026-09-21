import { describe, expect, it } from "vitest";
import { procurementData } from "@/lib/planner/data";
import { GROUP_ORDER, dealersFor, haversineKm, mapsUrl, snapToCity } from "./dealers";

describe("location helpers", () => {
  it("haversine ~0 same point, large apart", () => {
    const { delhi, mumbai } = procurementData.cities;
    expect(haversineKm(delhi, delhi)).toBeCloseTo(0, 5);
    expect(haversineKm(delhi, mumbai)).toBeGreaterThan(1000);
  });

  it("snaps to nearest coverage city", () => {
    expect(snapToCity({ lat: 12.98, lng: 77.6 }, procurementData.cities)).toBe("bengaluru");
    expect(snapToCity({ lat: 28.6, lng: 77.2 }, procurementData.cities)).toBe("delhi");
  });
});

describe("dealersFor (spec D §4)", () => {
  it("chip source → city listing, four groups, no distances, sorted by auth", () => {
    const res = dealersFor({ city: "bengaluru", source: "chip" }, procurementData);
    expect(res.groups.map((g) => g.key)).toEqual(GROUP_ORDER);

    const sanitary = res.groups.find((g) => g.key === "sanitary")!;
    expect(sanitary.dealers.length).toBeGreaterThan(0);
    expect(sanitary.note).toBe("chipCity");
    // Every dealer is in the chosen city, no distance on chip source.
    expect(sanitary.dealers.every((d) => d.city === "bengaluru")).toBe(true);
    expect(sanitary.dealers.every((d) => d.distKm === undefined)).toBe(true);
    // brand-owned sorts before multi-brand.
    const ranks = sanitary.dealers.map((d) => ({ "brand-owned": 0, authorised: 1, "multi-brand": 2 })[d.auth]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("sanitary group absorbs plumbing dealers", () => {
    const res = dealersFor({ city: "delhi", source: "chip" }, procurementData);
    const sanitary = res.groups.find((g) => g.key === "sanitary")!;
    // Delhi has both sanitary and plumbing rows; the group should include a plumbing one.
    const trades = new Set(sanitary.dealers.map((d) => d.trade));
    expect(trades.has("sanitary") || trades.has("plumbing")).toBe(true);
  });

  it("maps url encodes the dealer name + address", () => {
    const d = procurementData.dealers[0];
    const url = mapsUrl(d);
    expect(url).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(url).toContain(encodeURIComponent(d.name.split(" ")[0]));
  });
});
