"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useT } from "@/lib/i18n/useT";
import { Annotation } from "@/components/ui/Annotation";
import { PLANNER_TOOLS } from "@/lib/content";

/**
 * "See it. Change it. Perfect it." — the planner tease.
 *
 * The selection rectangle is genuinely draggable (pointer or arrow keys) and
 * the toolbar genuinely changes what is selected, because a still image of a
 * planner would undersell the one thing this section is claiming.
 *
 * Positions are percentages of the frame, so dragging survives any breakpoint.
 */
export default function PlannerDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState("bathtub");
  // Default sits clear of the copy column on the left.
  const [pos, setPos] = useState({ x: 62, y: 58 });
  const [dragging, setDragging] = useState(false);
  const grab = useRef({ dx: 0, dy: 0 });

  const clamp = (x: number, y: number) => ({
    x: Math.min(82, Math.max(18, x)),
    y: Math.min(84, Math.max(30, y)),
  });

  const moveTo = useCallback((clientX: number, clientY: number) => {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box) return;
    setPos(
      clamp(
        ((clientX - box.left) / box.width) * 100 - grab.current.dx,
        ((clientY - box.top) / box.height) * 100 - grab.current.dy,
      ),
    );
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => moveTo(e.clientX, e.clientY);
    const stop = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging, moveTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 6 : 2;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = d[e.key];
    if (!delta) return;
    e.preventDefault();
    setPos((p) => clamp(p.x + delta[0], p.y + delta[1]));
  };

  const tr = useT();
  const activeLabel = tr(PLANNER_TOOLS.find((entry) => entry.id === tool)?.label ?? "Fixture");

  return (
    <section
      id="planner"
      className="relative isolate min-h-[420px] overflow-hidden rounded-card sm:min-h-[520px] lg:min-h-[560px]"
      ref={frameRef}
    >
      <Image
        src="/photos/planner.jpg"
        alt="A dark, modern bathroom with a glass shower, stone walls and a timber vanity"
        fill
        sizes="(max-width: 1024px) 100vw, 58vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgb(10_18_30/0.82),rgb(10_18_30/0.55)_46%,rgb(10_18_30/0.28))]"
      />

      <div className="relative z-10 flex h-full flex-col justify-center p-7 sm:p-10 lg:max-w-[58%] lg:p-12">
        <h2 className="text-[38px] leading-[1.06] font-semibold tracking-[-0.03em] text-white sm:text-[52px]">
          {tr("See it.")}
          <br />
          {tr("Change it.")}
          <br />
          {tr("Perfect it.")}
        </h2>
        <p className="mt-5 max-w-sm text-[16.5px] leading-relaxed text-white/80">
          {tr(
            "Drag, drop and explore different layouts, fittings, tiles and colours before you start building.",
          )}
        </p>
        {/* The entry point to the studio. This sits on a photograph, so it keeps
            the white-on-photo variant rather than the clay used inside the planner. */}
        <Button href="/planner" variant="white" size="md" withArrow className="mt-7 self-start">
          {tr("Try the Planner")}
        </Button>
      </div>

      {/* Selected fixture. */}
      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={`${activeLabel} — ${tr("drag, or move with the arrow keys")}`}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            const box = frameRef.current?.getBoundingClientRect();
            if (box) {
              grab.current = {
                dx: ((e.clientX - box.left) / box.width) * 100 - pos.x,
                dy: ((e.clientY - box.top) / box.height) * 100 - pos.y,
              };
            }
            setDragging(true);
          }}
          className={[
            "relative flex h-[92px] w-[132px] cursor-grab items-center justify-center rounded-[6px]",
            "border-2 border-dashed border-brand-soft bg-brand/10 backdrop-blur-[1px]",
            "transition-colors duration-150 active:cursor-grabbing",
            dragging ? "bg-brand/20" : "",
          ].join(" ")}
        >
          <span className="text-white/85">
            <Icon name={tool as IconName} size={30} />
          </span>
          {[
            "-top-1 -left-1",
            "-top-1 -right-1",
            "-bottom-1 -left-1",
            "-bottom-1 -right-1",
          ].map((corner) => (
            <span
              key={corner}
              aria-hidden="true"
              className={`absolute ${corner} h-2 w-2 rounded-[1px] bg-white ring-1 ring-brand`}
            />
          ))}
        </div>

        {/* Handwritten hint, riding along with the selection. */}
        <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 items-center gap-1 sm:flex">
          <span className="on-light rounded-[6px] bg-white px-2.5 py-1 shadow-lift">
            <Annotation className="block text-[15px] leading-tight whitespace-nowrap text-ink" rotate={-3}>
              {tr("Move & explore")}
            </Annotation>
          </span>
        </div>
      </div>

      {/* Fixture toolbar. */}
      <div className="on-light absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 rounded-[14px] bg-white/95 p-1.5 shadow-lift backdrop-blur sm:block">
        <ul className="flex flex-col gap-0.5" role="listbox" aria-label={tr("Bathroom fixtures")}>
          {PLANNER_TOOLS.map(({ id, label }) => {
            const active = id === tool;
            return (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setTool(id)}
                  className={[
                    "flex w-[62px] flex-col items-center gap-1 rounded-[10px] px-1 py-2 transition-colors duration-150",
                    active ? "bg-wash text-brand" : "text-body hover:bg-wash hover:text-brand",
                  ].join(" ")}
                >
                  <Icon name={id as IconName} size={19} />
                  <span className="text-[9.5px] font-medium">{tr(label)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
