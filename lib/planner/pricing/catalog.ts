/**
 * Section B — item catalog: map the planner's Section A state onto the priced
 * item taxonomy (spec B §3.5 "quantities, all derived, none stored").
 *
 * Section A here is coarser than the old prototype the spec was written against
 * (we carry fixtures + add-ons + a computed BOM, not per-item concealed/visible
 * rows). So each fixture is decomposed into the priced items it implies, and
 * tile / cement / sand / adhesive / grout quantities are derived from room
 * geometry the same way `estimate/engine.ts` does. Items with quantity 0 are
 * dropped by the pricing layer.
 */
import type { Project } from "@/lib/planner/types";
import type { PriceUnit, Trade } from "@/lib/planner/data/types";

export interface PricedItem {
  /** Key into the price / brand tables. */
  itemKey: string;
  trade: Trade;
  qty: number;
  unit: PriceUnit;
}

/** Default tile size — Section A does not capture one; 12"×18" is the common pick. */
const TILE = { floorKey: "floorTiles_12x18", wallKey: "wallTiles_12x18", pieceSqft: 1.5, perBox: 6 };
const BOX_SQFT = TILE.pieceSqft * TILE.perBox; // 9 sq.ft per box

/** Room geometry, mirroring estimate/engine.ts so Section B agrees with Step 5. */
function geometry(project: Project) {
  const { room } = project;
  const L = room.lengthInches;
  const W = room.widthInches;
  const floorSqft = (L * W) / 144;
  const wallGrossSqft = (2 * (L + W) * room.heightInches) / 144;
  const doorSqft = (room.door.widthInches * 80) / 144;
  const windowSqft = room.window ? (room.window.widthInches * 36) / 144 : 0;
  const wallSqft = Math.max(0, wallGrossSqft - doorSqft - windowSqft);
  return { L, W, floorSqft, wallSqft, totalTileSqft: floorSqft + wallSqft };
}

function has(project: Project, type: Project["fixtures"][number]["type"]): number {
  return project.fixtures.filter((f) => f.type === type).length;
}
function hasAddon(project: Project, a: Project["addOns"][number]): boolean {
  return project.addOns.includes(a);
}

/** Build the full list of priced items for a project (before qty-0 filtering). */
export function catalogItems(project: Project): PricedItem[] {
  const items: PricedItem[] = [];
  const push = (itemKey: string, trade: Trade, qty: number, unit: PriceUnit) => {
    if (qty > 0) items.push({ itemKey, trade, qty, unit });
  };

  /* ── Sanitaryware & fittings ─────────────────────────────────────────── */
  for (const f of project.fixtures) {
    if (f.type === "wc") {
      push("visibleWc", "sanitary", 1, "pc");
      if (f.variant === "wallHung" || f.variant === "smart") push("concealedCistern", "sanitary", 1, "pc");
      push("visibleSeatCover", "sanitary", 1, "pc");
    } else if (f.type === "vanity") {
      push("visibleBasin", "sanitary", 1, "pc");
      push("visibleBasinTap", "sanitary", 1, "pc");
      push("visibleBottleTrap", "sanitary", 1, "pc");
    } else if (f.type === "shower") {
      push("concealedMixerBody", "sanitary", 1, "pc");
      push("visibleMixerHandle", "sanitary", 1, "pc");
      push("visibleOverheadShower", "sanitary", 1, "pc");
    } else if (f.type === "almirah" && f.variant === "mirrorCabinet") {
      push("visibleMirror", "sanitary", 1, "pc");
    }
  }
  if (hasAddon(project, "healthFaucet")) push("visibleHealthFaucet", "sanitary", 1, "pc");
  if (hasAddon(project, "towelRail")) push("visibleTowelRod", "sanitary", 1, "pc");
  if (hasAddon(project, "floorDrain")) push("concealedFloorDrain", "sanitary", 1, "pc");

  // Plumbing rollups (same drivers as estimate/engine.ts).
  const angleValves =
    has(project, "vanity") * 2 +
    has(project, "wc") +
    (hasAddon(project, "healthFaucet") ? 1 : 0) +
    (hasAddon(project, "geyser") ? 2 : 0);
  push("visibleAngleValve", "sanitary", angleValves, "pc");
  const pTraps = has(project, "wc") + has(project, "vanity") + (hasAddon(project, "floorDrain") ? 1 : 0);
  push("concealedPtrap", "sanitary", pTraps, "pc");

  const SUPPLY_FT: Record<string, number> = { wc: 8, vanity: 6, shower: 10 };
  const DRAIN_FT: Record<string, number> = { wc: 6, vanity: 5, shower: 6 };
  let supplyFt = hasAddon(project, "geyser") ? 8 : 0;
  supplyFt += hasAddon(project, "healthFaucet") ? 4 : 0;
  let drainFt = hasAddon(project, "floorDrain") ? 3 : 0;
  for (const f of project.fixtures) {
    supplyFt += SUPPLY_FT[f.type] ?? 0;
    drainFt += DRAIN_FT[f.type] ?? 0;
  }
  push("concealedPipe", "sanitary", supplyFt, "ft");
  push("concealedWaste", "sanitary", drainFt, "ft");

  /* ── Tiles & masonry ─────────────────────────────────────────────────── */
  const g = geometry(project);
  push(TILE.floorKey, "tiles", Math.ceil(g.floorSqft / BOX_SQFT), "box");
  push(TILE.wallKey, "tiles", Math.ceil(g.wallSqft / BOX_SQFT), "box");
  push("cement", "tiles", Math.ceil(g.totalTileSqft / 40), "bag");
  push("sand", "tiles", Math.ceil(g.totalTileSqft / 8), "cft");
  push("adhesive", "tiles", Math.ceil(g.totalTileSqft / 40), "bag");
  push("grout", "tiles", Math.ceil(g.totalTileSqft / 100), "kg");

  /* ── Electrical appliances ───────────────────────────────────────────── */
  if (hasAddon(project, "geyser")) push("geyserName", "electrical", 1, "pc");
  if (hasAddon(project, "exhaustFan")) push("fanName", "electrical", 1, "pc");

  /* ── Switches & wires ────────────────────────────────────────────────── */
  const applianceCount = (hasAddon(project, "geyser") ? 1 : 0) + (hasAddon(project, "exhaustFan") ? 1 : 0);
  if (hasAddon(project, "geyser")) push("wireGeyser", "wiring", 12, "ft");
  if (hasAddon(project, "exhaustFan")) push("wireFan", "wiring", 10, "ft");
  push("wireConduit", "wiring", Math.ceil((2 * (g.L + g.W)) / 12), "ft");
  push("wireBoxes", "wiring", applianceCount + 2, "pc");
  push("switchesSockets", "wiring", applianceCount + 2, "pc");

  return items;
}

/** The four trades in display order. */
export const TRADES: Trade[] = ["sanitary", "tiles", "electrical", "wiring"];
