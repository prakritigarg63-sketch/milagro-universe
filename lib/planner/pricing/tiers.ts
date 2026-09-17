/**
 * Section B — tier rules (spec B §3.3, amended 2026-09-15).
 *
 * The four budget tiers (our `costTier` values) map onto the three brand tiers
 * in the price/brand tables: t1 Premium, t2 Mid, t3 Value. This module is the
 * one place that mapping lives — unit price for a tier, which brand tiers a
 * budget unlocks, and the upgrade shown on a row.
 */
import type { CostTier } from "@/lib/planner/types";
import type { PriceRow } from "@/lib/planner/data/types";

/** Brand tier keys in the tables: t1 Premium → t3 Value. */
export type BrandTier = "t1" | "t2" | "t3";

/**
 * Round a unit price (spec B §3.3, amended): nearest ₹1 below ₹100; nearest ₹10
 * from ₹100 to below ₹1,000; nearest ₹50 at or above ₹1,000. Unit prices only —
 * never line totals. The amendment keeps per-foot wire prices (₹3–₹4) from
 * collapsing to ₹0 under a flat nearest-₹10 rule.
 */
export function roundINR(n: number): number {
  if (n < 100) return Math.round(n);
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

/** Unit price for the chosen budget tier. */
export function unitPriceForTier(row: PriceRow, tier: CostTier): number {
  switch (tier) {
    case "budget":
      return roundINR(row.value);
    case "costEffective":
      return roundINR((row.value + row.mid) / 2);
    case "goodQuality":
      return roundINR(row.mid);
    case "topOfLine":
      return roundINR(row.premium);
  }
}

/** Brand tiers the budget unlocks, best tier first. */
export function brandTiersFor(tier: CostTier): BrandTier[] {
  switch (tier) {
    case "budget":
      return ["t3"];
    case "costEffective":
      return ["t2", "t3"];
    case "goodQuality":
      return ["t1", "t2"];
    case "topOfLine":
      return ["t1"];
  }
}

/** The single upgrade tier shown on a row, or null for Top of the Line. */
export function upgradeTierFor(tier: CostTier): BrandTier | null {
  switch (tier) {
    case "budget":
      return "t2";
    case "costEffective":
    case "goodQuality":
      return "t1";
    case "topOfLine":
      return null;
  }
}

/** Upgrade unit price for a row, or null when there is no upgrade. */
export function upgradeUnitPrice(row: PriceRow, tier: CostTier): number | null {
  switch (tier) {
    case "budget":
      return roundINR(row.mid); // t2 at mid
    case "costEffective":
    case "goodQuality":
      return roundINR(row.premium); // t1 at premium
    case "topOfLine":
      return null;
  }
}
