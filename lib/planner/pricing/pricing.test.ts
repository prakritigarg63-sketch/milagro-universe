import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/planner/types";
import { plannerData } from "@/lib/planner/data";
import { defaultAddOns, defaultFixtures, defaultRoom, defaultStyle } from "@/lib/planner/defaults";
import {
  brandTiersFor,
  fullEstimate,
  haversineKm,
  priceMaterials,
  priceSection,
  roundINR,
  snapToCity,
  unitPriceForTier,
  upgradeUnitPrice,
} from "./index";

function sampleProject(over: Partial<Project> = {}): Project {
  return {
    id: "p1",
    ownerId: "u1",
    members: [{ userId: "u1", role: "owner" }],
    status: "planned",
    room: defaultRoom(),
    style: defaultStyle(), // costTier: goodQuality
    fixtures: defaultFixtures(),
    addOns: defaultAddOns(),
    plan: null,
    estimate: null,
    createdAt: "2026-09-17T00:00:00.000Z",
    updatedAt: "2026-09-17T00:00:00.000Z",
    ...over,
  };
}

describe("tiers (spec B §3.3)", () => {
  it("roundINR three bands", () => {
    expect(roundINR(33)).toBe(33); // <100 → nearest 1
    expect(roundINR(9500)).toBe(9500); // ≥1000 → nearest 50
    expect(roundINR(9549)).toBe(9550);
    expect(roundINR(145)).toBe(150); // 100–1000 → nearest 10
  });

  it("unit price per tier for a known row", () => {
    const wc = plannerData.prices.visibleWc; // value 7500, mid 11500, premium 15500
    expect(unitPriceForTier(wc, "budget")).toBe(7500);
    expect(unitPriceForTier(wc, "costEffective")).toBe(9500); // round((7500+11500)/2)
    expect(unitPriceForTier(wc, "goodQuality")).toBe(11500);
    expect(unitPriceForTier(wc, "topOfLine")).toBe(15500);
  });

  it("brand tiers unlocked, upgrade price", () => {
    expect(brandTiersFor("budget")).toEqual(["t3"]);
    expect(brandTiersFor("goodQuality")).toEqual(["t1", "t2"]);
    const wc = plannerData.prices.visibleWc;
    expect(upgradeUnitPrice(wc, "topOfLine")).toBeNull();
    expect(upgradeUnitPrice(wc, "budget")).toBe(11500); // t2 at mid
  });
});

describe("pricing (spec B §4)", () => {
  it("sanitary section includes the WC and prices at the tier", () => {
    const p = sampleProject();
    const sec = priceSection(p, "sanitary", plannerData);
    const wcRow = sec.rows.find((r) => r.itemKey === "visibleWc");
    expect(wcRow?.qty).toBe(1);
    expect(wcRow?.unitPrice).toBe(11500); // goodQuality → mid
    expect(sec.total).toBe(sec.rows.reduce((s, r) => s + r.lineTotal, 0));
  });

  it("section totals sum to the material total; sections cover 4 trades", () => {
    const m = priceMaterials(sampleProject(), plannerData);
    expect(m.sections.map((s) => s.trade)).toEqual(["sanitary", "tiles", "electrical", "wiring"]);
    expect(m.materialTotal).toBe(m.sections.reduce((s, sec) => s + sec.total, 0));
    expect(m.missing).toEqual([]); // every catalog item has a price row
  });

  it("drops zero-quantity items (empty project → no WC)", () => {
    const empty = sampleProject({ fixtures: [], addOns: [] });
    const sec = priceSection(empty, "sanitary", plannerData);
    expect(sec.rows.find((r) => r.itemKey === "visibleWc")).toBeUndefined();
  });

  it("full estimate adds labour once a city is resolved", () => {
    const noCity = fullEstimate(sampleProject(), plannerData);
    expect(noCity.labour.total).toBe(0); // gated until B5 resolves a city

    const withCity = fullEstimate(
      sampleProject({ location: { lat: 12.97, lng: 77.59, city: "bengaluru", source: "device" } }),
      plannerData,
    );
    expect(withCity.labour.band).toBe("bengaluru");
    expect(withCity.labour.total).toBeGreaterThan(0);
    expect(withCity.grandTotal).toBe(withCity.material.materialTotal + withCity.labour.total);
    expect(withCity.perSqft).toBeGreaterThan(0);
  });
});

describe("location (spec B §3.3)", () => {
  it("haversine is ~0 at the same point and positive apart", () => {
    const delhi = plannerData.cities.delhi;
    expect(haversineKm(delhi, delhi)).toBeCloseTo(0, 5);
    expect(haversineKm(delhi, plannerData.cities.mumbai)).toBeGreaterThan(1000);
  });

  it("snaps a coordinate to the nearest coverage city", () => {
    expect(snapToCity({ lat: 12.98, lng: 77.6 }, plannerData.cities)).toBe("bengaluru");
    expect(snapToCity({ lat: 28.6, lng: 77.2 }, plannerData.cities)).toBe("delhi");
  });
});
