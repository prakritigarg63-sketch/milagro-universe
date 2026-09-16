"use client";

import type { DoorDetail, FixtureType, PlacedFixture, Room } from "@/lib/planner/types";
import { describePlaced } from "@/lib/planner/studio/fixtures";
import { inwardNormal, openingSegment } from "@/lib/planner/studio/geometry";
import { useT } from "@/lib/i18n/useT";

/**
 * The room, seen at an angle.
 *
 * An axonometric projection in plain SVG rather than a 3D engine. That is a
 * deliberate trade: it renders instantly, reads correctly in both themes, needs
 * no asset pipeline, and — most importantly — it is driven by exactly the same
 * fixture positions as the 2D plan, so the two views can never disagree. What
 * it is not is a photoreal render, and it should not pretend to be one.
 */

/** Typical heights, in inches. Enough to read the shape of the room. */
const HEIGHT: Record<FixtureType, number> = {
  wc: 30,
  vanity: 34,
  shower: 78,
  almirah: 60,
};

/** Fixtures that read better as translucent (glass enclosures). */
const GLASSY: FixtureType[] = ["shower"];

/** A standard door leaf. Clipped to the wall if the room is unusually short. */
const DOOR_HEIGHT = 80;

/**
 * Label type size, in projected units.
 *
 * A fraction of the drawing, not a pixel size: SVG text scales with the
 * viewBox, so a label keeps its weight relative to the room whatever size the
 * panel is — about 22px in the showcase and 11px on the small plan card.
 * Deliberately lighter than the 2D plan, whose labels sit inside a fixture box
 * and have to fill it; these sit on top of the geometry and only have to name
 * it without burying it.
 */
const LABEL_SIZE = 4;

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

/** Room inches → projected SVG units. */
function project(x: number, y: number, z: number) {
  return { px: (x - y) * COS30, py: (x + y) * SIN30 - z };
}

function poly(points: { px: number; py: number }[]): string {
  return points.map((p) => `${p.px.toFixed(2)},${p.py.toFixed(2)}`).join(" ");
}

/** Resolved colours for the surfaces this view can show. */
export interface ViewPalette {
  floor?: string;
  floorAccent?: string;
  walls?: string;
  wallsAccent?: string;
  vanity?: string;
  shower?: string;
  wc?: string;
  almirah?: string;
  /** Tints the whole room, standing in for lamp colour temperature. */
  light?: string;
}

interface Props {
  room: Room;
  fixtures: PlacedFixture[];
  selectedIndex: number | null;
  /** Which way the door is hinged and which way it opens. */
  doorDetail?: DoorDetail;
  /** Name every item in the room. On by default — an unlabelled massing block
   *  tells a homeowner nothing about which box is the WC. */
  labels?: boolean;
  palette?: ViewPalette;
  /** Larger type and no selection affordances, for the visualize screen. */
  showcase?: boolean;
}

export function RoomView3D({
  room,
  fixtures,
  selectedIndex,
  doorDetail,
  labels = true,
  palette = {},
  showcase = false,
}: Props) {
  const t = useT();
  const { lengthInches: L, widthInches: W } = room;
  const wallHeight = room.heightInches;

  // Bounding box of everything we will draw, so the viewBox always fits.
  const corners = [
    project(0, 0, 0),
    project(L, 0, 0),
    project(0, W, 0),
    project(L, W, 0),
    project(0, 0, wallHeight),
    project(L, 0, wallHeight),
    project(0, W, wallHeight),
  ];
  const minX = Math.min(...corners.map((c) => c.px)) - 12;
  const maxX = Math.max(...corners.map((c) => c.px)) + 12;
  const minY = Math.min(...corners.map((c) => c.py)) - 12;
  const maxY = Math.max(...corners.map((c) => c.py)) + 12;

  const floor = [project(0, 0, 0), project(L, 0, 0), project(L, W, 0), project(0, W, 0)];
  const backWall = [
    project(0, 0, 0),
    project(L, 0, 0),
    project(L, 0, wallHeight),
    project(0, 0, wallHeight),
  ];
  const leftWall = [
    project(0, 0, 0),
    project(0, W, 0),
    project(0, W, wallHeight),
    project(0, 0, wallHeight),
  ];

  /* ── The door ────────────────────────────────────────────────────────────
     Two things matter to a homeowner: where the doorway is, and how much floor
     the leaf sweeps. Both are drawn from room coordinates and then projected,
     so the swing lands exactly where the 2D plan puts it. */
  const doorH = Math.min(DOOR_HEIGHT, wallHeight);
  const seg = openingSegment(room.door, room);
  const hingeLeft = (doorDetail?.hinge ?? "left") === "left";
  const opensIn = (doorDetail?.swing ?? "in") === "in";
  const hinge = hingeLeft ? { x: seg.x1, y: seg.y1 } : { x: seg.x2, y: seg.y2 };
  const far = hingeLeft ? { x: seg.x2, y: seg.y2 } : { x: seg.x1, y: seg.y1 };
  const n = inwardNormal(room.door.wall);
  const dir = opensIn ? 1 : -1;
  const radius = room.door.widthInches;
  const leafEnd = { x: hinge.x + n.x * radius * dir, y: hinge.y + n.y * radius * dir };

  /** The quarter turn the leaf sweeps, as points on the floor. */
  const swing = (() => {
    const a0 = Math.atan2(leafEnd.y - hinge.y, leafEnd.x - hinge.x);
    const a1 = Math.atan2(far.y - hinge.y, far.x - hinge.x);
    let delta = a1 - a0;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const steps = 14;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const a = a0 + (delta * i) / steps;
      return project(hinge.x + Math.cos(a) * radius, hinge.y + Math.sin(a) * radius, 0);
    });
  })();

  /** The doorway itself, on the plane of its wall. */
  const doorPanel = [
    project(seg.x1, seg.y1, 0),
    project(seg.x2, seg.y2, 0),
    project(seg.x2, seg.y2, doorH),
    project(seg.x1, seg.y1, doorH),
  ];

  /** Where to put the door's label: just inside the swept floor. */
  const doorLabelAt = project(
    hinge.x + n.x * radius * dir * 0.55 + (far.x - hinge.x) * 0.3,
    hinge.y + n.y * radius * dir * 0.55 + (far.y - hinge.y) * 0.3,
    0,
  );

  // Painter's algorithm: draw far fixtures first so near ones overlap them.
  const ordered = fixtures
    .map((f, index) => ({ f, index }))
    .sort((a, b) => a.f.x + a.f.y - (b.f.x + b.f.y));

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      width="100%"
      className="block h-auto w-full"
      role="img"
      aria-label={`Angled view of the bathroom: ${
        fixtures.map((f) => describePlaced(f)).join(", ") || t("no fixtures")
      }, ${t("and the door on the")} ${room.door.wall} ${t("wall")}`}
    >
      <defs>
        <linearGradient id="mu-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.floorAccent ?? "var(--color-wash-deep)"} />
          <stop offset="100%" stopColor={palette.floor ?? "var(--color-wash)"} />
        </linearGradient>
      </defs>

      <polygon points={poly(floor)} fill="url(#mu-floor)" />
      <polygon points={poly(backWall)} fill={palette.walls ?? "var(--color-wash)"} opacity={0.9} />
      <polygon points={poly(leftWall)} fill={palette.wallsAccent ?? palette.walls ?? "var(--color-wash-deep)"} opacity={0.72} />

      {/* Floor grid, one line per foot, for a sense of scale. */}
      <g stroke="var(--color-brand)" strokeOpacity={0.12} strokeWidth={0.4}>
        {Array.from({ length: Math.floor(L / 12) }, (_, i) => (i + 1) * 12).map((x) => {
          const a = project(x, 0, 0);
          const b = project(x, W, 0);
          return <line key={`gx${x}`} x1={a.px} y1={a.py} x2={b.px} y2={b.py} vectorEffect="non-scaling-stroke" />;
        })}
        {Array.from({ length: Math.floor(W / 12) }, (_, i) => (i + 1) * 12).map((y) => {
          const a = project(0, y, 0);
          const b = project(L, y, 0);
          return <line key={`gy${y}`} x1={a.px} y1={a.py} x2={b.px} y2={b.py} vectorEffect="non-scaling-stroke" />;
        })}
      </g>

      {/* The floor the door needs, and the doorway it comes through. */}
      <g>
        <polygon
          points={poly([project(hinge.x, hinge.y, 0), ...swing])}
          fill="var(--color-brand)"
          fillOpacity={0.07}
          stroke="var(--color-body-soft)"
          strokeWidth={0.6}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          points={poly(doorPanel)}
          fill={palette.floor ?? "var(--color-surface)"}
          fillOpacity={0.55}
          stroke="var(--color-ink-soft)"
          strokeWidth={0.9}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={project(hinge.x, hinge.y, 0).px}
          y1={project(hinge.x, hinge.y, 0).py}
          x2={project(leafEnd.x, leafEnd.y, 0).px}
          y2={project(leafEnd.x, leafEnd.y, 0).py}
          stroke="var(--color-ink-soft)"
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {ordered.map(({ f, index }) => (
        <Box3D
          key={`${f.type}-${index}`}
          fixture={f}
          selected={selectedIndex === index}
          color={palette[f.type]}
        />
      ))}

      {/* Lamp colour, as a wash over everything. Subtle on purpose — this is a
          hint at colour temperature, not a lighting simulation. */}
      {palette.light && (
        <polygon
          points={poly(floor)}
          fill={palette.light}
          opacity={0.14}
          pointerEvents="none"
        />
      )}

      {/* Names, drawn after everything so no box can hide one. The halo is a
          stroke painted under the glyphs, which keeps them legible on a dark
          tile, a glass shower or the floor alike. */}
      {labels && (
        <g
          fontSize={LABEL_SIZE}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="central"
          stroke="var(--color-surface)"
          strokeWidth={1.1}
          strokeLinejoin="round"
          paintOrder="stroke"
          pointerEvents="none"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {ordered.map(({ f, index }) => {
            const c = project(
              f.x + f.widthInches / 2,
              f.y + f.depthInches / 2,
              HEIGHT[f.type],
            );
            return (
              <text key={`label-${index}`} x={c.px} y={c.py} fill="var(--color-ink)">
                {describePlaced(f)}
              </text>
            );
          })}
          <text x={doorLabelAt.px} y={doorLabelAt.py} fill="var(--color-body)">
            {t("Door")}
          </text>
        </g>
      )}

      {/* Room outline last, so it frames everything. */}
      <polygon
        points={poly(floor)}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={showcase ? 2 : 1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** One fixture as a simple extruded box: top, and two visible sides. */
function Box3D({
  fixture,
  selected,
  color,
}: {
  fixture: PlacedFixture;
  selected: boolean;
  color?: string;
}) {
  const h = HEIGHT[fixture.type];
  const { x, y, widthInches: w, depthInches: d } = fixture;
  const glass = GLASSY.includes(fixture.type);

  const top = [
    project(x, y, h),
    project(x + w, y, h),
    project(x + w, y + d, h),
    project(x, y + d, h),
  ];
  // The two faces that point toward the viewer in this projection.
  const frontFace = [
    project(x, y + d, 0),
    project(x + w, y + d, 0),
    project(x + w, y + d, h),
    project(x, y + d, h),
  ];
  const sideFace = [
    project(x + w, y, 0),
    project(x + w, y + d, 0),
    project(x + w, y + d, h),
    project(x + w, y, h),
  ];

  const stroke = selected ? "var(--color-brand)" : "var(--color-ink-soft)";
  // A chosen finish colours the fixture; otherwise it stays a neutral massing
  // block, so "not yet decided" never looks like a decision.
  const base = color ?? (selected ? "var(--color-brand)" : "var(--color-ink-soft)");
  const opacity = glass ? 0.22 : color ? 0.95 : 0.42;

  return (
    <g>
      <title>{describePlaced(fixture)}</title>
      <polygon points={poly(sideFace)} fill={base} fillOpacity={opacity * 0.7} stroke={stroke} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      <polygon points={poly(frontFace)} fill={base} fillOpacity={opacity * 0.85} stroke={stroke} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      <polygon points={poly(top)} fill={base} fillOpacity={opacity * 0.45} stroke={stroke} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
    </g>
  );
}
