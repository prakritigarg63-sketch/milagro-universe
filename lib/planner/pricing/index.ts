/**
 * Section B pricing — public surface. Pure engine (no i18n, no DOM); the UI
 * layer translates keys and formats rupees.
 */
import type { Project } from "@/lib/planner/types";
import type { PlannerData } from "@/lib/planner/data/types";
import { floorSqft, priceMaterials, type MaterialEstimate } from "./pricing";
import { labourEstimate, type LabourEstimate } from "./labour";

export * from "./tiers";
export * from "./catalog";
export * from "./pricing";
export * from "./labour";
export * from "./location";

export interface FullEstimate {
  material: MaterialEstimate;
  labour: LabourEstimate;
  /** Materials + labour. */
  grandTotal: number;
  /** grandTotal / floor sq.ft (0 when floor area unknown). */
  perSqft: number;
}

/** The B6 all-in estimate: four trade sections + labour + grand total. */
export function fullEstimate(project: Project, data: PlannerData): FullEstimate {
  const material = priceMaterials(project, data);
  const labour = labourEstimate(project, data);
  const grandTotal = material.materialTotal + labour.total;
  const sqft = floorSqft(project);
  return { material, labour, grandTotal, perSqft: sqft > 0 ? Math.round(grandTotal / sqft) : 0 };
}
