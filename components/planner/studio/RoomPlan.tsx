"use client";

import { useRef, type MouseEvent } from "react";
import type {
  DoorDetail,
  ExtraOpening,
  FixtureType,
  GeneratedPlan,
  PlacedFixture,
  PlumbingPoint,
  Room,
} from "@/lib/planner/types";
import {
  doorSwingPaths,
  nearestWall,
  openingSegment,
  plumbingPoint,
  type Point,
} from "@/lib/planner/studio/geometry";
import { formatLength, type LengthUnit } from "@/lib/planner/studio/measure";

/** Inches of margin around the room, for dimension labels. */
const PAD = 26;

const FIXTURE_LABEL: Record<FixtureType, string> = {
  wc: "WC",
  vanity: "Basin",
  shower: "Shower",
  almirah: "Storage",
};

const PLUMBING_LABEL: Record<PlumbingPoint["type"], string> = {
  wcOutlet: "WC outlet",
  basinPoint: "Basin point",
  showerPoint: "Shower point",
  waterInlet: "Water inlet",
};

/** Short glyph for a service point — colour alone never carries the meaning. */
const PLUMBING_GLYPH: Record<PlumbingPoint["type"], string> = {
  wcOutlet: "W",
  basinPoint: "B",
  showerPoint: "S",
  waterInlet: "I",
};

interface Props {
  room: Room;
  unit: LengthUnit;
  plan?: GeneratedPlan | null;
  /** Overrides plan.fixtures once the homeowner has moved things. */
  placed?: PlacedFixture[] | null;
  doorDetail?: DoorDetail;
  extraOpenings?: ExtraOpening[];
  plumbing?: PlumbingPoint[];
  /** Click anywhere to snap to the nearest wall — used for placing openings. */
  onWallClick?: (wall: ReturnType<typeof nearestWall>) => void;
  /** Id of a selected plumbing point or opening, outlined in brand blue. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Hides labels and dimensions for the small cards on the layouts screen. */
  compact?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * The bathroom, drawn to scale.
 *
 * One component serves the measurement preview, the openings editor, the
 * layout thumbnails and the planner canvas — because they are all the same
 * drawing with different things switched on. Keeping it single means a door
 * drawn on the measure screen is the same door, in the same place, as the one
 * on the final plan.
 */
export function RoomPlan({
  room,
  unit,
  plan = null,
  placed = null,
  doorDetail,
  extraOpenings = [],
  plumbing = [],
  onWallClick,
  selectedId = null,
  onSelect,
  compact = false,
  className = "",
  ariaLabel,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { lengthInches: L, widthInches: W } = room;
  const fixtures = placed ?? plan?.fixtures ?? [];
  const interactive = Boolean(onWallClick);

  /** Screen point → room inches, via the SVG's own coordinate transform so it
   *  stays correct at any size or aspect without re-deriving the scale. */
  function toRoomPoint(event: MouseEvent): Point | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const local = p.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  function handleClick(event: MouseEvent) {
    if (!onWallClick) return;
    const point = toRoomPoint(event);
    if (point) onWallClick(nearestWall(point, room));
  }

  const gridStep = 12;
  const verticals: number[] = [];
  const horizontals: number[] = [];
  for (let x = gridStep; x < L; x += gridStep) verticals.push(x);
  for (let y = gridStep; y < W; y += gridStep) horizontals.push(y);

  const door = openingSegment(room.door, room);
  const swing = doorSwingPaths(room.door, room, doorDetail?.hinge ?? "left", doorDetail?.swing ?? "in");
  const windows = [
    ...(room.window ? [{ id: "primary-window", kind: "window" as const, ...room.window }] : []),
    ...extraOpenings,
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`${-PAD} ${-PAD} ${L + PAD * 2} ${W + PAD * 2}`}
      width="100%"
      role="img"
      aria-label={
        ariaLabel ??
        `Bathroom plan, ${formatLength(L, unit)} by ${formatLength(W, unit)}, with ${fixtures.length} fixtures`
      }
      onClick={handleClick}
      className={`block h-auto w-full ${interactive ? "cursor-crosshair" : ""} ${className}`}
    >
      {/* Floor + a foot grid, so scale is readable without measuring. */}
      <rect x={0} y={0} width={L} height={W} fill="var(--color-wash)" />
      <g stroke="var(--color-brand)" strokeOpacity={0.1} strokeWidth={0.5}>
        {verticals.map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={W} vectorEffect="non-scaling-stroke" />
        ))}
        {horizontals.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={L} y2={y} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      <rect
        x={0}
        y={0}
        width={L}
        height={W}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />

      {/* Fixtures under the openings, so a door arc reads on top of a vanity. */}
      {fixtures.map((f, i) => (
        <g key={`${f.type}-${i}`}>
          <rect
            x={f.x}
            y={f.y}
            width={f.widthInches}
            height={f.depthInches}
            rx={2}
            fill="var(--color-brand)"
            fillOpacity={0.14}
            stroke="var(--color-brand)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {!compact && (
            <text
              x={f.x + f.widthInches / 2}
              y={f.y + f.depthInches / 2}
              fill="var(--color-ink)"
              fontSize={6.5}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {FIXTURE_LABEL[f.type]}
            </text>
          )}
        </g>
      ))}

      {/* Door: a gap in the wall, plus leaf and swing arc. */}
      <line
        x1={door.x1}
        y1={door.y1}
        x2={door.x2}
        y2={door.y2}
        stroke="var(--color-wash)"
        strokeWidth={5}
        vectorEffect="non-scaling-stroke"
      />
      <g stroke="var(--color-body-soft)" fill="none">
        <line
          x1={swing.leaf.x1}
          y1={swing.leaf.y1}
          x2={swing.leaf.x2}
          y2={swing.leaf.y2}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <path d={swing.arc} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Windows and vents. A vent is dashed; a window is a double line. */}
      {windows.map((w) => {
        const seg = openingSegment(w, room);
        const selected = selectedId === w.id;
        return (
          <g
            key={w.id}
            onClick={(e) => {
              if (!onSelect) return;
              e.stopPropagation();
              onSelect(w.id);
            }}
            className={onSelect ? "cursor-pointer" : ""}
          >
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="var(--color-surface)"
              strokeWidth={5}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={selected ? "var(--color-brand)" : "var(--color-ink-soft)"}
              strokeWidth={selected ? 3 : 2}
              strokeDasharray={w.kind === "vent" ? "4 3" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}

      {/* Service points. Each carries its own letter, so the ring colour is
          reinforcement rather than the only signal. */}
      {plumbing.map((pt) => {
        const p = plumbingPoint(pt, room);
        const selected = selectedId === pt.id;
        return (
          <g
            key={pt.id}
            onClick={(e) => {
              if (!onSelect) return;
              e.stopPropagation();
              onSelect(pt.id);
            }}
            className={onSelect ? "cursor-pointer" : ""}
          >
            <title>{PLUMBING_LABEL[pt.type]}</title>
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill="var(--color-surface)"
              stroke={selected ? "var(--color-brand)" : "var(--color-ink-soft)"}
              strokeWidth={selected ? 2.5 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={p.x}
              y={p.y}
              fill={selected ? "var(--color-brand)" : "var(--color-ink-soft)"}
              fontSize={6}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {PLUMBING_GLYPH[pt.type]}
            </text>
          </g>
        );
      })}

      {!compact && (
        <g fill="var(--color-body-soft)" fontSize={8} fontWeight={600}>
          <text x={L / 2} y={-10} textAnchor="middle">
            {formatLength(L, unit)}
          </text>
          <text
            x={-11}
            y={W / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${-11} ${W / 2})`}
          >
            {formatLength(W, unit)}
          </text>
        </g>
      )}
    </svg>
  );
}
