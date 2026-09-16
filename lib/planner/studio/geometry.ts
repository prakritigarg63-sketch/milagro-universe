import type { Opening, PlumbingPoint, Room, Wall } from "@/lib/planner/types";

/**
 * Plan geometry, in room-inch coordinates.
 *
 * Origin (0,0) is the back-left corner; x runs along the room's length, y along
 * its width — the same frame the layout engine emits `PlacedFixture` in, so
 * nothing has to be translated between the engine and the drawing.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** How long a given wall is, in inches. */
export function wallLength(wall: Wall, room: Room): number {
  return wall === "back" || wall === "front" ? room.lengthInches : room.widthInches;
}

/** The endpoints of an opening's gap on its wall. */
export function openingSegment(opening: Opening, room: Room): Segment {
  const { lengthInches: L, widthInches: W } = room;
  const half = opening.widthInches / 2;
  const o = opening.offsetInches;
  switch (opening.wall) {
    case "back":
      return { x1: o - half, y1: 0, x2: o + half, y2: 0 };
    case "front":
      return { x1: o - half, y1: W, x2: o + half, y2: W };
    case "left":
      return { x1: 0, y1: o - half, x2: 0, y2: o + half };
    default:
      return { x1: L, y1: o - half, x2: L, y2: o + half };
  }
}

/** A point on a wall, at `offset` inches along it. */
export function pointOnWall(wall: Wall, offset: number, room: Room): Point {
  switch (wall) {
    case "back":
      return { x: offset, y: 0 };
    case "front":
      return { x: offset, y: room.widthInches };
    case "left":
      return { x: 0, y: offset };
    default:
      return { x: room.lengthInches, y: offset };
  }
}

export function plumbingPoint(point: PlumbingPoint, room: Room): Point {
  return pointOnWall(point.wall, point.offsetInches, room);
}

/** Unit vector pointing from a wall into the room. */
export function inwardNormal(wall: Wall): Point {
  switch (wall) {
    case "back":
      return { x: 0, y: 1 };
    case "front":
      return { x: 0, y: -1 };
    case "left":
      return { x: 1, y: 0 };
    default:
      return { x: -1, y: 0 };
  }
}

/**
 * Which wall a click landed on, and how far along it.
 *
 * Used for click-to-place. Picks the nearest wall to the point rather than
 * requiring a precise hit on a 2-inch line — placing a door should not be a
 * test of mouse accuracy.
 */
export function nearestWall(p: Point, room: Room): { wall: Wall; offset: number } {
  const { lengthInches: L, widthInches: W } = room;
  const candidates: { wall: Wall; distance: number; offset: number }[] = [
    { wall: "back", distance: Math.abs(p.y), offset: p.x },
    { wall: "front", distance: Math.abs(W - p.y), offset: p.x },
    { wall: "left", distance: Math.abs(p.x), offset: p.y },
    { wall: "right", distance: Math.abs(L - p.x), offset: p.y },
  ];
  const best = candidates.reduce((a, b) => (b.distance < a.distance ? b : a));
  const max = wallLength(best.wall, room);
  return { wall: best.wall, offset: Math.max(0, Math.min(max, Math.round(best.offset))) };
}

/**
 * Door leaf + swing arc, as SVG path data.
 *
 * `hinge` picks which end of the gap the leaf turns on; `swing` decides whether
 * it opens into the room or out of it. Both matter to a homeowner — a door that
 * opens onto the WC is the classic small-bathroom mistake.
 */
export function doorSwingPaths(
  opening: Opening,
  room: Room,
  hinge: "left" | "right" = "left",
  swing: "in" | "out" = "in",
): { leaf: Segment; arc: string } {
  const seg = openingSegment(opening, room);
  const r = opening.widthInches;
  const horizontal = opening.wall === "back" || opening.wall === "front";

  // Hinge end of the gap, and the far end the arc sweeps to.
  const start = hinge === "left" ? { x: seg.x1, y: seg.y1 } : { x: seg.x2, y: seg.y2 };
  const far = hinge === "left" ? { x: seg.x2, y: seg.y2 } : { x: seg.x1, y: seg.y1 };

  const n = inwardNormal(opening.wall);
  const dir = swing === "in" ? 1 : -1;

  const leafEnd: Point = horizontal
    ? { x: start.x, y: start.y + r * n.y * dir }
    : { x: start.x + r * n.x * dir, y: start.y };

  // Sweep direction flips with both hinge side and swing side; the product of
  // the two is what actually decides it.
  const sweep = (hinge === "left" ? 1 : 0) ^ (swing === "in" ? 0 : 1);

  return {
    leaf: { x1: start.x, y1: start.y, x2: leafEnd.x, y2: leafEnd.y },
    arc: `M ${leafEnd.x} ${leafEnd.y} A ${r} ${r} 0 0 ${sweep} ${far.x} ${far.y}`,
  };
}

/** Axis-aligned overlap test, used for placement feedback. */
export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
