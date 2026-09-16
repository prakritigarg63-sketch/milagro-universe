"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from "react";
import type {
  DoorDetail,
  ExtraOpening,
  PlacedFixture,
  PlumbingPoint,
  Room,
} from "@/lib/planner/types";
import {
  doorSwingPaths,
  openingSegment,
  plumbingPoint,
} from "@/lib/planner/studio/geometry";
import { describePlaced } from "@/lib/planner/studio/fixtures";
import type { PlacementFeedback } from "@/lib/planner/studio/placement";
import { formatLength, type LengthUnit } from "@/lib/planner/studio/measure";

const PAD = 26;
/** Arrow-key nudge, in inches. Shift makes it a foot. */
const NUDGE = 1;

/** Outline colour per feedback level. Never the only signal — see the badge. */
const LEVEL_STROKE: Record<PlacementFeedback["level"], string> = {
  comfortable: "var(--color-brand)",
  tight: "#b8801f",
  conflict: "var(--color-danger)",
};

interface Props {
  room: Room;
  unit: LengthUnit;
  fixtures: PlacedFixture[];
  feedback: PlacementFeedback[];
  selectedIndex: number | null;
  doorDetail?: DoorDetail;
  extraOpenings?: ExtraOpening[];
  plumbing?: PlumbingPoint[];
  onSelect: (index: number | null) => void;
  /** Called once per gesture, on release — one undo step per drag. */
  onMove: (index: number, x: number, y: number) => void;
}

/**
 * The editable plan.
 *
 * Dragging is pointer-based so it works with a mouse, a finger and a pen, and
 * every fixture is also a focusable element the arrow keys move — a planner you
 * can only use by dragging is a planner some people cannot use at all.
 *
 * A drag updates local state while it is happening and commits once on release,
 * so undo steps back a whole movement rather than a hundred pixels of it.
 */
export function DesignCanvas({
  room,
  unit,
  fixtures,
  feedback,
  selectedIndex,
  doorDetail,
  extraOpenings = [],
  plumbing = [],
  onSelect,
  onMove,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ index: number; dx: number; dy: number; x: number; y: number } | null>(
    null,
  );
  const { lengthInches: L, widthInches: W } = room;

  function toRoom(event: { clientX: number; clientY: number }) {
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

  function startDrag(event: ReactPointerEvent, index: number) {
    const point = toRoom(event);
    if (!point) return;
    const f = fixtures[index];
    // Capture keeps the drag alive if the pointer leaves the shape. It can throw
    // for a pointer the browser no longer considers active; losing capture is
    // survivable, losing the drag is not.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* drag still tracks via the svg-level handlers */
    }
    onSelect(index);
    setDrag({ index, dx: point.x - f.x, dy: point.y - f.y, x: f.x, y: f.y });
  }

  function moveDrag(event: ReactPointerEvent) {
    if (!drag) return;
    const point = toRoom(event);
    if (!point) return;
    const f = fixtures[drag.index];
    const x = Math.max(0, Math.min(L - f.widthInches, Math.round(point.x - drag.dx)));
    const y = Math.max(0, Math.min(W - f.depthInches, Math.round(point.y - drag.dy)));
    setDrag({ ...drag, x, y });
  }

  function endDrag(event: ReactPointerEvent) {
    if (!drag) return;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* never captured */
    }
    const f = fixtures[drag.index];
    if (drag.x !== f.x || drag.y !== f.y) onMove(drag.index, drag.x, drag.y);
    setDrag(null);
  }

  function onKey(event: KeyboardEvent, index: number) {
    const step = event.shiftKey ? 12 : NUDGE;
    const f = fixtures[index];
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    onMove(
      index,
      Math.max(0, Math.min(L - f.widthInches, f.x + delta[0])),
      Math.max(0, Math.min(W - f.depthInches, f.y + delta[1])),
    );
  }

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
      className="block h-auto w-full touch-none select-none"
      role="application"
      aria-label="Bathroom planner canvas"
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <rect x={0} y={0} width={L} height={W} fill="var(--color-wash)" />
      <g stroke="var(--color-brand)" strokeOpacity={0.1} strokeWidth={0.5}>
        {Array.from({ length: Math.floor(L / 12) }, (_, i) => (i + 1) * 12).map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={W} vectorEffect="non-scaling-stroke" />
        ))}
        {Array.from({ length: Math.floor(W / 12) }, (_, i) => (i + 1) * 12).map((y) => (
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

      {/* Fixtures */}
      {fixtures.map((f, i) => {
        const live = drag?.index === i ? { x: drag.x, y: drag.y } : { x: f.x, y: f.y };
        const fb = feedback[i];
        const selected = selectedIndex === i;
        const stroke = LEVEL_STROKE[fb?.level ?? "comfortable"];
        return (
          <g
            key={`${f.type}-${i}`}
            tabIndex={0}
            role="button"
            aria-label={`${describePlaced(f)} — ${fb?.title ?? ""}. Arrow keys to move.`}
            onKeyDown={(e) => onKey(e, i)}
            onFocus={() => onSelect(i)}
            onClick={(e) => {
              // Selecting must not depend on a successful drag gesture.
              e.stopPropagation();
              onSelect(i);
            }}
            onPointerDown={(e) => startDrag(e, i)}
            className="cursor-grab outline-none focus-visible:[&>rect]:stroke-[3]"
            style={{ cursor: drag?.index === i ? "grabbing" : "grab" }}
          >
            <rect
              x={live.x}
              y={live.y}
              width={f.widthInches}
              height={f.depthInches}
              rx={2}
              fill={stroke}
              fillOpacity={selected ? 0.22 : 0.13}
              stroke={stroke}
              strokeWidth={selected ? 2.5 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={live.x + f.widthInches / 2}
              y={live.y + f.depthInches / 2}
              fill="var(--color-ink)"
              fontSize={6}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
              pointerEvents="none"
            >
              {describePlaced(f)}
            </text>
            {/* Conflicts get a mark as well as a colour. */}
            {fb?.level === "conflict" && (
              <text
                x={live.x + f.widthInches - 4}
                y={live.y + 5}
                fill={stroke}
                fontSize={7}
                fontWeight={800}
                textAnchor="middle"
                pointerEvents="none"
              >
                !
              </text>
            )}
            {fb?.level === "tight" && (
              <text
                x={live.x + f.widthInches - 4}
                y={live.y + 5}
                fill={stroke}
                fontSize={7}
                fontWeight={800}
                textAnchor="middle"
                pointerEvents="none"
              >
                △
              </text>
            )}
          </g>
        );
      })}

      {/* Door */}
      <line
        x1={door.x1}
        y1={door.y1}
        x2={door.x2}
        y2={door.y2}
        stroke="var(--color-wash)"
        strokeWidth={5}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <g stroke="var(--color-body-soft)" fill="none" pointerEvents="none">
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

      {/* Windows + vents */}
      {windows.map((w) => {
        const seg = openingSegment(w, room);
        return (
          <g key={w.id} pointerEvents="none">
            <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke="var(--color-surface)" strokeWidth={5} vectorEffect="non-scaling-stroke" />
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="var(--color-ink-soft)"
              strokeWidth={2}
              strokeDasharray={w.kind === "vent" ? "4 3" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}

      {/* Service points */}
      {plumbing.map((pt) => {
        const p = plumbingPoint(pt, room);
        return (
          <circle
            key={pt.id}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="var(--color-surface)"
            stroke="var(--color-ink-soft)"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        );
      })}

      <g fill="var(--color-body-soft)" fontSize={8} fontWeight={600} pointerEvents="none">
        <text x={L / 2} y={-10} textAnchor="middle">
          {formatLength(L, unit)}
        </text>
        <text x={-11} y={W / 2} textAnchor="middle" transform={`rotate(-90 ${-11} ${W / 2})`}>
          {formatLength(W, unit)}
        </text>
      </g>
    </svg>
  );
}
