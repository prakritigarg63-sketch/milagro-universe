/**
 * Section B — pricing engine. Pure: takes the project and the injected data
 * tables, returns section estimates and a material total. Quantities come from
 * `catalog.ts`; unit prices from `tiers.ts`. i18n and formatting live in the UI.
 */
import type { CostTier, Project } from "@/lib/planner/types";
import type { PlannerData, PriceUnit, Trade } from "@/lib/planner/data/types";
import { catalogItems, TRADES } from "./catalog";
import { unitPriceForTier, upgradeUnitPrice } from "./tiers";

export interface PricedRow {
  itemKey: string;
  qty: number;
  unit: PriceUnit;
  unitPrice: number;
  lineTotal: number;
  /** Research row was an estimate → UI shows an "estimate" tag. */
  est: boolean;
  /** Upgrade unit price for this row, or null (Top of the Line). */
  upgradeUnitPrice: number | null;
}

export interface SectionEstimate {
  trade: Trade;
  /** Chosen brand for the trade, or null until picked. */
  brand: string | null;
  rows: PricedRow[];
  total: number;
}

export interface MaterialEstimate {
  tier: CostTier;
  sections: SectionEstimate[];
  materialTotal: number;
  /** Item keys that had no price row (should be empty; surfaced for tests). */
  missing: string[];
}

/** Price a single trade's rows for the project's current tier. */
export function priceSection(project: Project, trade: Trade, data: PlannerData): SectionEstimate {
  const tier = project.style.costTier;
  const rows: PricedRow[] = [];
  for (const item of catalogItems(project)) {
    if (item.trade !== trade) continue;
    const priceRow = data.prices[item.itemKey];
    if (!priceRow) continue; // reported by priceMaterials via `missing`
    const unitPrice = unitPriceForTier(priceRow, tier);
    rows.push({
      itemKey: item.itemKey,
      qty: item.qty,
      unit: item.unit,
      unitPrice,
      lineTotal: Math.round(item.qty * unitPrice),
      est: priceRow.est,
      upgradeUnitPrice: upgradeUnitPrice(priceRow, tier),
    });
  }
  const total = rows.reduce((s, r) => s + r.lineTotal, 0);
  return { trade, brand: project.tradeBrands?.[trade] ?? null, rows, total };
}

/** Price all four trades and sum the material total. */
export function priceMaterials(project: Project, data: PlannerData): MaterialEstimate {
  const missing: string[] = [];
  for (const item of catalogItems(project)) {
    if (!data.prices[item.itemKey]) missing.push(item.itemKey);
  }
  const sections = TRADES.map((t) => priceSection(project, t, data));
  const materialTotal = sections.reduce((s, sec) => s + sec.total, 0);
  return { tier: project.style.costTier, sections, materialTotal, missing };
}

/** Floor area in sq.ft — used for the `≈ ₹/sq.ft` figure on B6. */
export function floorSqft(project: Project): number {
  return (project.room.lengthInches * project.room.widthInches) / 144;
}
