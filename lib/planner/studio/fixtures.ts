import type { IconName } from "@/components/ui/Icon";
import type { FixtureChoice, FixtureType, FixtureVariant, PlacedFixture, Placement, Room } from "@/lib/planner/types";
import { footprintFor } from "@/lib/planner/layout/footprints";

/**
 * The fixture palette.
 *
 * The homeowner sees eight things they recognise; the domain has four types
 * with variants. A bathtub is a shower in a tub enclosure, a cabinet and a
 * tall unit are the same storage type at different sizes. Mapping here rather
 * than widening `FixtureType` keeps the layout engine, the footprint table and
 * the estimate working off one vocabulary — adding a fifth type would mean
 * teaching all three about it for no gain the homeowner can see.
 */

export interface PaletteItem {
  id: string;
  label: string;
  icon: IconName;
  type: FixtureType;
  variant?: FixtureVariant;
  /** Shower stores its enclosure in `placement`, which also sizes it. */
  placement: Placement;
  /** Shown under the label so the mapping is never a surprise. */
  hint: string;
}

export const PALETTE: PaletteItem[] = [
  { id: "toilet", label: "Toilet", icon: "toilet", type: "wc", variant: "floorMounted", placement: "back", hint: "Floor-mounted WC" },
  { id: "wallHungWc", label: "Wall-hung WC", icon: "toilet", type: "wc", variant: "wallHung", placement: "back", hint: "Compact, wall-mounted" },
  { id: "basin", label: "Sink / Basin", icon: "sink", type: "vanity", variant: "wallHungBasin", placement: "right", hint: "Basin without a cabinet" },
  { id: "vanity", label: "Vanity", icon: "cabinet", type: "vanity", variant: "countertop", placement: "right", hint: "Basin with storage under" },
  { id: "shower", label: "Shower", icon: "shower", type: "shower", variant: "rainShower", placement: "walkIn", hint: "Walk-in enclosure" },
  { id: "bathtub", label: "Bathtub", icon: "bathtub", type: "shower", variant: "handheld", placement: "tubCombo", hint: "Tub with shower over" },
  { id: "cabinet", label: "Cabinet / Mirror", icon: "layers", type: "almirah", variant: "mirrorCabinet", placement: "underVanity", hint: "Mirrored wall cabinet" },
  { id: "storage", label: "Storage", icon: "bag", type: "almirah", variant: "tallUnit", placement: "dryCorner", hint: "Tall storage unit" },
];

export function paletteItem(id: string): PaletteItem | undefined {
  return PALETTE.find((p) => p.id === id);
}

/** The `FixtureChoice` a palette item represents, for footprint lookup. */
export function choiceFor(item: PaletteItem): FixtureChoice {
  return { type: item.type, placement: item.placement, variant: item.variant };
}

/**
 * Drop a new fixture into the room.
 *
 * Placed at the centre by default, then nudged so it starts inside the walls.
 * Deliberately not auto-arranged: the homeowner asked for this one, and moving
 * it somewhere clever would hide where it landed.
 */
export function createPlaced(item: PaletteItem, room: Room, at?: { x: number; y: number }): PlacedFixture {
  const fp = footprintFor(choiceFor(item));
  const w = fp.along;
  const h = fp.from;
  const cx = at?.x ?? room.lengthInches / 2;
  const cy = at?.y ?? room.widthInches / 2;
  return {
    type: item.type,
    x: clamp(cx - w / 2, 0, Math.max(0, room.lengthInches - w)),
    y: clamp(cy - h / 2, 0, Math.max(0, room.widthInches - h)),
    widthInches: w,
    depthInches: h,
    rotation: 0,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Swap width and depth — a 90° turn for an axis-aligned box. */
export function rotatePlaced(f: PlacedFixture, room: Room): PlacedFixture {
  const rotated: PlacedFixture = {
    ...f,
    widthInches: f.depthInches,
    depthInches: f.widthInches,
    rotation: (f.rotation + 90) % 360,
  };
  return {
    ...rotated,
    x: clamp(rotated.x, 0, Math.max(0, room.lengthInches - rotated.widthInches)),
    y: clamp(rotated.y, 0, Math.max(0, room.widthInches - rotated.depthInches)),
  };
}

/** A copy, offset far enough to be visibly a second object. */
export function duplicatePlaced(f: PlacedFixture, room: Room): PlacedFixture {
  const offset = 6;
  return {
    ...f,
    x: clamp(f.x + offset, 0, Math.max(0, room.lengthInches - f.widthInches)),
    y: clamp(f.y + offset, 0, Math.max(0, room.widthInches - f.depthInches)),
  };
}

/** Move to an absolute position, kept inside the room. */
export function movePlaced(f: PlacedFixture, x: number, y: number, room: Room): PlacedFixture {
  return {
    ...f,
    x: clamp(x, 0, Math.max(0, room.lengthInches - f.widthInches)),
    y: clamp(y, 0, Math.max(0, room.widthInches - f.depthInches)),
  };
}

/** Which palette entry best describes a placed fixture, for the details panel. */
export function describePlaced(f: PlacedFixture): string {
  switch (f.type) {
    case "wc":
      return f.widthInches <= 20 && f.depthInches <= 22 ? "Wall-hung WC" : "Toilet";
    case "vanity":
      return f.widthInches >= 24 ? "Vanity" : "Basin";
    case "shower":
      return f.widthInches >= 60 || f.depthInches >= 60 ? "Bathtub" : "Shower";
    case "almirah":
      return f.widthInches >= 24 ? "Storage" : "Cabinet";
  }
}
