import type { FixtureType, PlacedFixture, Room } from "@/lib/planner/types";
import { openingSegment, rectsOverlap } from "./geometry";

/**
 * Homeowner-facing placement feedback.
 *
 * Not a building-code checker. It answers one question — "will this be
 * comfortable to use?" — in the terms someone standing in their own bathroom
 * would use, and it says what to do about it rather than naming a rule.
 *
 * The clearances below are widely-used residential planning guides, not
 * regulations, and the copy never claims otherwise.
 */

export type PlacementLevel = "comfortable" | "tight" | "conflict";

export interface PlacementFeedback {
  level: PlacementLevel;
  /** Short status, e.g. "A little tight". */
  title: string;
  /** One sentence the homeowner can act on. */
  detail: string;
}

/** Recommended clear space in front of each fixture, in inches. */
const FRONT_CLEARANCE: Record<FixtureType, number> = {
  wc: 18,
  vanity: 21,
  shower: 24,
  almirah: 12,
};

/** Below this fraction of the recommendation, it stops being "a little" tight. */
const TIGHT_FACTOR = 0.75;

const LABEL: Record<FixtureType, string> = {
  wc: "the WC",
  vanity: "the basin",
  shower: "the shower",
  almirah: "the storage unit",
};

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function boxOf(f: PlacedFixture): Box {
  return { x: f.x, y: f.y, w: f.widthInches, h: f.depthInches };
}

/**
 * The strip a fixture needs in front of it. Which way "in front" points is
 * inferred from the wall the fixture is sitting against — the side with the
 * most room is the side you approach from.
 */
function approachStrip(f: PlacedFixture, room: Room): Box {
  const need = FRONT_CLEARANCE[f.type];
  const gaps = {
    back: f.y,
    front: room.widthInches - (f.y + f.depthInches),
    left: f.x,
    right: room.lengthInches - (f.x + f.widthInches),
  };
  // Against the wall with the smallest gap; approached from the opposite side.
  const against = (Object.keys(gaps) as (keyof typeof gaps)[]).reduce((a, b) =>
    gaps[b] < gaps[a] ? b : a,
  );
  switch (against) {
    case "back":
      return { x: f.x, y: f.y + f.depthInches, w: f.widthInches, h: need };
    case "front":
      return { x: f.x, y: f.y - need, w: f.widthInches, h: need };
    case "left":
      return { x: f.x + f.widthInches, y: f.y, w: need, h: f.depthInches };
    default:
      return { x: f.x - need, y: f.y, w: need, h: f.depthInches };
  }
}

/** How much of the approach strip is actually free, as a fraction 0–1. */
function approachFreedom(f: PlacedFixture, all: PlacedFixture[], room: Room): number {
  const strip = approachStrip(f, room);
  const need = Math.max(strip.w, strip.h);

  // Clipped by the room itself.
  const insideX = Math.max(0, Math.min(strip.x + strip.w, room.lengthInches) - Math.max(strip.x, 0));
  const insideY = Math.max(0, Math.min(strip.y + strip.h, room.widthInches) - Math.max(strip.y, 0));
  const available = strip.w > strip.h ? insideX : insideY;

  // Any other fixture intruding into the strip eats the rest of it.
  const blocked = all.some((other) => other !== f && rectsOverlap(strip, boxOf(other)));
  if (blocked) return 0;

  return need === 0 ? 1 : Math.max(0, Math.min(1, available / need));
}

/** The quarter-circle a door sweeps, approximated by its bounding box. */
function doorSweepBox(room: Room): Box {
  const seg = openingSegment(room.door, room);
  const r = room.door.widthInches;
  const x = Math.min(seg.x1, seg.x2);
  const y = Math.min(seg.y1, seg.y2);
  switch (room.door.wall) {
    case "back":
      return { x, y, w: r, h: r };
    case "front":
      return { x, y: y - r, w: r, h: r };
    case "left":
      return { x, y, w: r, h: r };
    default:
      return { x: x - r, y, w: r, h: r };
  }
}

/** Nudge distance, phrased in the units the room is being planned in. */
function nudgeText(inches: number, metric: boolean): string {
  return metric ? `${Math.round(inches * 2.54 / 5) * 5} cm` : `${Math.round(inches)} in`;
}

/**
 * Feedback for one fixture, given everything else in the room.
 * `metric` only changes how the suggested nudge is phrased.
 */
export function feedbackFor(
  fixture: PlacedFixture,
  all: PlacedFixture[],
  room: Room,
  metric = false,
): PlacementFeedback {
  const box = boxOf(fixture);
  const label = LABEL[fixture.type];

  // 1. Outside the room.
  if (
    box.x < -0.5 ||
    box.y < -0.5 ||
    box.x + box.w > room.lengthInches + 0.5 ||
    box.y + box.h > room.widthInches + 0.5
  ) {
    return {
      level: "conflict",
      title: "Outside the room",
      detail: `Part of ${label} is beyond the wall. Drag it back inside.`,
    };
  }

  // 2. Overlapping another fixture.
  const clash = all.find((other) => other !== fixture && rectsOverlap(box, boxOf(other)));
  if (clash) {
    return {
      level: "conflict",
      title: "Placement conflict",
      detail: `This fixture overlaps ${LABEL[clash.type]}.`,
    };
  }

  // 3. In the door's swing.
  if (rectsOverlap(box, doorSweepBox(room))) {
    return {
      level: "conflict",
      title: "In the door’s path",
      detail: `The door would hit ${label} as it opens.`,
    };
  }

  // 4. Not enough room to stand in front of it.
  const freedom = approachFreedom(fixture, all, room);
  if (freedom < TIGHT_FACTOR) {
    const short = FRONT_CLEARANCE[fixture.type] * (1 - freedom);
    return {
      level: "tight",
      title: "A little tight",
      detail: `Moving this about ${nudgeText(short, metric)} further from the wall opposite may make the space more comfortable.`,
    };
  }

  return {
    level: "comfortable",
    title: "Comfortable placement",
    detail: "Good clearance around the fixture.",
  };
}

/** Feedback for every fixture, keyed by index in the array. */
export function feedbackForAll(
  fixtures: PlacedFixture[],
  room: Room,
  metric = false,
): PlacementFeedback[] {
  return fixtures.map((f) => feedbackFor(f, fixtures, room, metric));
}

/** The worst level present, for a single summary line. */
export function worstLevel(all: PlacementFeedback[]): PlacementLevel {
  if (all.some((f) => f.level === "conflict")) return "conflict";
  if (all.some((f) => f.level === "tight")) return "tight";
  return "comfortable";
}
